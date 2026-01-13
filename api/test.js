export default async function handler(req, res) {
  try {
    res.json({ 
      status: 'API is working!',
      timestamp: new Date().toISOString(),
      method: req.method
    });
  } catch (error) {
    res.status(500).json({ error: 'API error' });
  }
}