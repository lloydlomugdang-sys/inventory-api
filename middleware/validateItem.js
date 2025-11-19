module.exports = (req, res, next) => {
    const { name, qty } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Name is required and must be a string." });
    }
    if (qty === undefined || typeof qty !== 'number') {
        return res.status(400).json({ error: "Quantity is required and must be a number." });
    }
    next(); // Pass request to controller kung valid
};
