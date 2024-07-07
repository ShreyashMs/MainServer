exports.errorHandler = (res, error) => {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
};
