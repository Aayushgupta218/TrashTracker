import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');

let oauth2Client;

fs.readFile('C:/Users/gagan/OneDrive/Documents/gmailfunctioanlitycredentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content));
});

function authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken();
        oauth2Client.setCredentials(JSON.parse(token));
    });
}

function getNewToken() {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
}

export const sendMail = async (sender, receiver, subject, text, attachments) => {
    const accessToken = oauth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: sender,
            clientId: oauth2Client._clientId,
            clientSecret: oauth2Client._clientSecret,
            refreshToken: oauth2Client.credentials.refresh_token,
            accessToken: accessToken,
        },
    });

    const mailOptions = {
        from: sender,
        to: receiver,
        subject: subject,
        text: text,
        attachments: attachments,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
};