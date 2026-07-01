import { Request, Response } from 'express';
import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const validatePassword = (password: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  return regex.test(password);
};

const validateEmail = (email: string) => {
  const isLower = email === email.toLowerCase();
  const hasAt = email.includes('@');
  const hasDot = email.includes('.');
  return isLower && hasAt && hasDot;
};

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role, profile_picture, domain, organization_id } = req.body;
  
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'L\'email doit être en minuscule et contenir un @ et un point.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO users (name, email, password, role, profile_picture, domain, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, profile_picture, domain, organization_id',
      [name, email, hashedPassword, role || 'farmer', profile_picture || null, domain || null, organization_id || null]
    );
    
    const user = result.rows[0];
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    
    res.status(201).json({ user, token });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === '23505') { // Unique violation in PostgreSQL
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ message: 'Erreur lors de l’inscription' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    console.log(`[LOGIN ATTEMPT] Email parsed: "${cleanEmail}" (raw: "${email}")`);
    
    const result = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      console.warn(`[LOGIN FAILED] User not found in database for email: "${cleanEmail}"`);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    
    const user = result.rows[0];

    if (user.status === 'blocked') {
      console.warn(`[LOGIN BLOCKED] User ${user.id} attempted to log in but is blocked.`);
      return res.status(403).json({ message: 'Votre compte a été bloqué par un administrateur.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[LOGIN FAILED] Password mismatch for user: "${cleanEmail}"`);
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    console.log(`[LOGIN SUCCESS] User authenticated: "${cleanEmail}", role: "${user.role}"`);
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    
    res.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profile_picture: user.profile_picture,
        domain: user.domain,
        organization_id: user.organization_id,
        phone: user.phone,
        location: user.location
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// À ajouter dans authController.ts
export const getMe = async (req: Request, res: Response) => {
  try {
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser || !authenticatedUser.id) {
      return res.status(401).json({ message: 'Accès non autorisé : Session manquante' });
    }

    const result = await query(
      'SELECT id, name, email, role, profile_picture, domain, organization_id,phone, location, created_at FROM users WHERE id = $1',
      [authenticatedUser.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;
  const { name, email, profile_picture, domain, organization_id, phone, location } = req.body;
  
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Email invalide' });
  }

  try {
    const result = await query(
      'UPDATE users SET name = $1, email = $2, profile_picture = $3, domain = $4, organization_id = $5, phone = $6, location = $7 WHERE id = $8 RETURNING id, name, email, role, profile_picture, domain, organization_id, phone, location',
      [name, email, profile_picture, domain, organization_id, phone || null, location || null, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('UpdateMe error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const userRole = (req as any).user.role;
  try {
    let result;
    if (userRole === 'superadmin') {
      result = await query('SELECT id, name, email, role, profile_picture, domain, organization_id, created_at FROM users ORDER BY created_at DESC');
    } else if (userRole === 'admin') {
      result = await query('SELECT id, name, email, role, profile_picture, domain, organization_id, created_at FROM users WHERE role = \'farmer\' ORDER BY created_at DESC');
    } else {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    res.json(result.rows);
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  const adminRole = (req as any).user.role;
  const { name, email, password, role, profile_picture, domain, organization_id } = req.body;

  if (adminRole === 'admin' && role !== 'farmer') {
    return res.status(403).json({ message: 'Un administrateur ne peut créer que des Farmers.' });
  }
  if (adminRole !== 'superadmin' && adminRole !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  if (!validateEmail(email)) return res.status(400).json({ message: 'Email invalide.' });
  if (!validatePassword(password)) return res.status(400).json({ message: 'Format mot de passe invalide.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, role, profile_picture, domain, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role',
      [name, email, hashedPassword, role, profile_picture || null, domain || null, organization_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ message: 'Email déjà utilisé.' });
    res.status(500).json({ message: 'Erreur lors de la création.' });
  }
};

export const adminToggleBlockUser = async (req: Request, res: Response) => {
  const adminRole = (req as any).user.role;
  const { id } = req.params;

  try {
    const userResult = await query('SELECT role, status FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    
    const targetRole = userResult.rows[0].role;
    const currentStatus = userResult.rows[0].status || 'active';

    if (targetRole === 'superadmin') {
      return res.status(403).json({ message: 'Le SuperAdmin ne peut pas être bloqué.' });
    }

    if (adminRole === 'admin' && targetRole !== 'farmer') {
      return res.status(403).json({ message: 'Un administrateur ne peut bloquer que des Farmers.' });
    }

    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, id]);
    res.json({ message: `Utilisateur ${newStatus === 'blocked' ? 'bloqué' : 'débloqué'} avec succès.`, status: newStatus });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du changement de statut.' });
  }
};

export const adminUpdateUser = async (req: Request, res: Response) => {
  const adminRole = (req as any).user.role;
  const { id } = req.params;
  const { name, email, role, profile_picture, domain, organization_id, phone, location } = req.body;

  try {
    const userResult = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    
    const targetRole = userResult.rows[0].role;

    if (adminRole === 'admin') {
      if (targetRole !== 'farmer') {
        return res.status(403).json({ message: 'Un administrateur ne peut modifier que des Farmers.' });
      }
      if (role && role !== 'farmer') {
        return res.status(403).json({ message: 'Un administrateur ne peut pas promouvoir un utilisateur.' });
      }
    }

    if (targetRole === 'superadmin' && adminRole !== 'superadmin') {
       return res.status(403).json({ message: 'Seul un SuperAdmin peut modifier un autre SuperAdmin.' });
    }

    const result = await query(
      'UPDATE users SET name = $1, email = $2, role = $3, profile_picture = $4, domain = $5, organization_id = $6, phone = $7, location = $8 WHERE id = $9 RETURNING id, name, email, role, profile_picture, domain, organization_id, phone, location',
      [name, email, role || targetRole, profile_picture, domain, organization_id, phone || null, location || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aucun utilisateur avec cet email' });
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString();

    await query(
      "INSERT INTO reset_codes (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
      [email, code]
    );

    console.log(`[RECOVERY] Code for ${email} generated. Check your email.`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"AgriSense AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h1 style="color: #2e7d32; text-align: center;">Code de sécurité</h1>
            <p style="color: #333; font-size: 16px;">Bonjour,</p>
            <p style="color: #333; font-size: 16px;">Vous avez demandé la réinitialisation de votre mot de passe AgriSense AI.</p>
            <p style="color: #333; font-size: 16px;">Voici votre code de vérification à usage unique :</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; background-color: #f1f8e9; border: 2px dashed #4caf50; padding: 15px 30px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1b5e20;">${code}</span>
            </div>
            <p style="color: #333; font-size: 16px;">Ce code expirera dans <strong>15 minutes</strong>.</p>
            <p style="color: #777; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre compte reste en sécurité.
            </p>
          </div>
        `
      });
    } else {
      console.warn('⚠️ EMAIL_USER ou EMAIL_PASS manquant dans le .env, le mail n\'a pas pu être envoyé. Code (debug):', code);
    }
    
    res.json({ message: 'Un email contenant votre code de vérification vous a été envoyé.' });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du code' });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const result = await query(
      'SELECT * FROM reset_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    res.json({ message: 'Code valide' });
  } catch (error) {
    console.error('VerifyCode error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.' });
  }

  try {
    const codeResult = await query(
      'SELECT * FROM reset_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ message: 'Session de réinitialisation invalide' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    
    await query('DELETE FROM reset_codes WHERE email = $1', [email]);

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation' });
  }
};
