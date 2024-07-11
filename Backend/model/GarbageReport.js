import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    address: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    feedback: {
        type: String
    },
    estimatedCompletionTime: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const GarbageReport = mongoose.model('GarbageReport', reportSchema);

export default GarbageReport;
