import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/config';

const client = new OAuth2Client();

export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: [
        config.googleWebClientId,
        config.googleAndroidClientId
      ].filter(Boolean) as string[],
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    return {
      googleId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      profileImageUrl: payload['picture'] || null,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid token');
  }
}