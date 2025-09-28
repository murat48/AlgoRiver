import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: 'AIzaSyCU7CaofF79Nr0SKmBaGTww6oaqas8v3Ww'
});

async function main() {
    try {
        console.log('🧪 Testing with @google/genai package...')
        console.log('🔑 API Key:', 'AIzaSyCU7CaofF79Nr0SKmBaGTww6oaqas8v3Ww'.substring(0, 10) + '...')
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Test connection. Please respond with 'OK'.",
        });
        
        console.log('✅ SUCCESS!')
        console.log('📄 Response:', response.text);
        
    } catch (error) {
        console.error('❌ ERROR!')
        console.error('📝 Error message:', error.message)
        console.error('📝 Error status:', error.status)
    }
}

main();
