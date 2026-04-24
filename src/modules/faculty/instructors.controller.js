export const getAll = async (req, res) => {
    res.json({ message: 'Get all items - Implementation in progress' });
};

export const getById = async (req, res) => {
    res.json({ message: 'Get item by id', id: req.params.id });
};

export const create = async (req, res) => {
    res.json({ message: 'Create item', data: req.body });
};

export const update = async (req, res) => {
    res.json({ message: 'Update item', id: req.params.id, data: req.body });
};

export const delete = async (req, res) => {
    res.json({ message: 'Delete item', id: req.params.id });
};
