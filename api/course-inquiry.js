import { enableCORS } from './cors.js';

export default async function handler(req, res) {
    // Enable CORS
    if (enableCORS(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fullName, email, phone, course } = req.body;
    if (!fullName || !email || !phone || !course) {
        return res.status(400).json({ ok: false, error: 'Missing required fields (name, email, phone, course)' });
    }

    try {
        // Return success without sending any emails
        // Client will handle the brochure download
        res.status(200).json({ 
            ok: true, 
            message: "Thank you! Your brochure is ready for download.",
            data: {
                name: fullName,
                email: email,
                phone: phone,
                course: course
            }
        });
    } catch (err) {
        console.error("Course Inquiry Error:", err);
        res.status(500).json({ ok: false, error: "Inquiry failed" });
    }
}
