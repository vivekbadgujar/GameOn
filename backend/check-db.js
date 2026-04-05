const mongoose = require('mongoose');
const fs = require('fs');

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', new mongoose.Schema({}, { strict: false }));
        const tournaments = await Tournament.find().sort({ createdAt: -1 }).limit(5);
        let out = '';
        for(let t of tournaments) {
            out += `ID: ${t._id}\n`;
            out += `Title: ${t.title || t.name}\n`;
            out += `thumbnail: ${t.thumbnail}\n`;
            out += `qrCode: ${t.qrCode}\n`;
            out += `poster: ${t.poster}\n\n`;
        }
        fs.writeFileSync('output-utf8.txt', out, 'utf8');
        console.log('done');
    } catch(err) {
        console.log('Error', err);
    } finally {
        mongoose.connection.close();
    }
}
checkDB();
