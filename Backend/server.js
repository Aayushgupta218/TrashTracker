import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from './model/User.js';
import GarbageReport from './model/GarbageReport.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/Cleanliness', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) {
    console.error('JWT verification error:', err);
    return res.status(403).json({message:'Invalid token'});
    }
    console.log('Decoded user:', user);
    req.user = user;
    next();
    });
   };

   const authorizeRoles = (roles) => {
    return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
    }
    next();
    };
   };

app.post('/api/register', async (req, res) => {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    try {
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(400).send('User registration failed');
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(400).json({ message: 'Invalid email or password' });
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aggarwalaayush220@gmail.com',
        pass: 'efvi grra ecyt zeta'
    }
});

app.post('/api/garbage-report', upload.single('image'), async (req, res) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const userId = decoded.id;

        const { latitude, longitude, address } = req.body; 
        const location = { latitude, longitude };
        const imageUrl = `/uploads/${req.file.filename}`;

        const report = new GarbageReport({ userId, location, address, imageUrl });
        await report.save();

        const imagePath = path.resolve('uploads', req.file.filename);

        const mailOptions = {
            from: 'aggarwalaayush220@gmail.com',
            to: 'nagpaladi05@gmail.com', 
            subject: 'Garbage Collection Report',
            text: `A new garbage collection report has been submitted for the location: 
                   Latitude: ${latitude}, Longitude: ${longitude}.
                   Address: ${address}`,
                   attachments: [
                    {
                        filename: req.file.filename,
                        path: imagePath
                    }
                ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Failed to send report. Please try again.');
            }
            res.status(200).send('Mail sent and Report submitted successfully!');
        });
    } catch (error) {
        console.error('Error submitting garbage report:', error);
        res.status(500).json({ message: 'Error submitting garbage report', error });
    }
});

app.get('/api/municipal/reports', authenticateToken, authorizeRoles(['committee']),
async (req, res) => {
 try {
 console.log('Fetching municipal reports request by:', req.user);
 const reports = await GarbageReport.find();
 res.json(reports);
 } catch (error) {
 console.error('Error fetching reports:', error);
 res.status(500).json({ message: 'Error fetching reports' });
 }
});

app.put('/api/garbage-report/:id/status', authenticateToken,
authorizeRoles(['committee']), async (req, res) => {
 const { id } = req.params;
 const { status, estimatedCompletionTime } = req.body;
 try {
 const report = await GarbageReport.findByIdAndUpdate(id, { status, estimatedCompletionTime }, { new: true });
 res.json(report);
 } catch (error) {
 res.status(500).send('Error updating report status');
 }
 });

app.delete('/api/garbage-report/:id',  authenticateToken, async (req, res) => {
    try {
        const reportId = req.params.id;
        const result = await GarbageReport.findByIdAndDelete(reportId);
        if (result) {
            res.status(200).json({ message: 'Report deleted successfully' });
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.use('/uploads', express.static('uploads'));

app.listen(2000, () => {
    console.log('Server is running on port 2000');
});
