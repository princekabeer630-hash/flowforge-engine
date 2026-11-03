import { Request, Response } from 'express';

// In-memory mock database for demonstration (you can replace this with your Mongoose User model later)
const users: any[] = [];

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    // Check if user already exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists with this email.' });
      return;
    }

    const newUser = { id: Date.now().toString(), name, email, password };
    users.push(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};