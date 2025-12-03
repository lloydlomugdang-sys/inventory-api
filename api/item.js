import connectDB from "../config/db.js";
import * as controller from "../controllers/itemControllers.js";
import validateItem from "../middlewares/validateItems.js";

export default async function handler(req, res) {
    // Connect sa MongoDB bago mag CRUD
    await connectDB();

    const { id, q } = req.query; // Para sa dynamic operations at search

    // -------------------------------
    // GET all items
    // -------------------------------
    if (req.method === "GET" && !id && !q) {
        return controller.getItems(req, res);
    }

    // -------------------------------
    // GET item by ID
    // -------------------------------
    if (req.method === "GET" && id) {
        req.params = { id };
        return controller.getItemById(req, res);
    }

    // -------------------------------
    // SEARCH items
    // -------------------------------
    if (req.method === "GET" && q) {
        return controller.searchItems(req, res);
    }

    // -------------------------------
    // CREATE new item
    // -------------------------------
    if (req.method === "POST") {
        if (!validateItem(req, res)) return; // Run validation
        return controller.createItem(req, res);
    }

    // -------------------------------
    // UPDATE (PUT) item
    // -------------------------------
    if (req.method === "PUT" && id) {
        if (!validateItem(req, res)) return; // Run validation
        req.params = { id };
        return controller.updateItem(req, res);
    }

    // -------------------------------
    // PARTIAL UPDATE (PATCH) item
    // -------------------------------
    if (req.method === "PATCH" && id) {
        req.params = { id };
        return controller.partialUpdateItem(req, res);
    }

    // -------------------------------
    // DELETE item
    // -------------------------------
    if (req.method === "DELETE" && id) {
        req.params = { id };
        return controller.deleteItem(req, res);
    }

    // -------------------------------
    // Method not allowed
    // -------------------------------
    res.status(405).json({ error: "Method Not Allowed" });
}
