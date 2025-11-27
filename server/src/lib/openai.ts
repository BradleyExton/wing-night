import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTeamLogo(prompt: string, teamId: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const enhancedPrompt = `Create a team logo/mascot for a party game team. Style: bold, fun, cartoon/mascot style, vibrant colors, suitable for a sports team or gaming team. The logo should be: ${prompt}. Make it eye-catching and memorable. No text in the image.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0]?.url;
  if (!imageUrl) {
    throw new Error('Failed to generate image');
  }

  // Download the image immediately since DALL-E URLs expire
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to download generated image');
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Ensure the logos directory exists
  const logosDir = path.join(__dirname, '../../public/logos');
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  // Save the image
  const filename = `team-${teamId}-${Date.now()}.png`;
  const filepath = path.join(logosDir, filename);
  fs.writeFileSync(filepath, buffer);

  // Return the public URL path
  return `/logos/${filename}`;
}

export default openai;
