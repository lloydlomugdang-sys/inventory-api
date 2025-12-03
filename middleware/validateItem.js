module.exports = (req, res, next) => {
    // Convert qty to quantity for consistent handling
    if (req.body.qty !== undefined) {
        req.body.quantity = req.body.qty;
        delete req.body.qty;
    }
    
    // Now validate using quantity (not qty)
    const { name, quantity, price } = req.body;
    
    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ 
            success: false,
            error: "Name is required and must be a non-empty string." 
        });
    }
    
    // Validate quantity
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ 
            success: false,
            error: "Quantity is required and must be a non-negative number." 
        });
    }
    
    // Validate price (add this if not present)
    if (price === undefined || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ 
            success: false,
            error: "Price is required and must be a non-negative number." 
        });
    }
    
    // Optional: Validate category if present
    if (req.body.category && typeof req.body.category !== 'string') {
        return res.status(400).json({ 
            success: false,
            error: "Category must be a string." 
        });
    }
    
    next(); // Pass request to controller if valid
};