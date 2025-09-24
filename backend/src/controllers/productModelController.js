const mongoose = require('mongoose');
const ProductModel = require('../models/ProductModel');

exports.createProductModel = async (req, res) => {
  try {
    const { name, description, partNumber } = req.body;

    if (!name || !partNumber) {
      return res.status(400).json({ message: 'Nombre y número de parte son obligatorios.' });
    }

    const normalizedPartNumber = partNumber.trim();
    const existing = await ProductModel.findOne({ partNumber: normalizedPartNumber });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Ya existe un modelo de producto con ese número de parte.' });
    }

    const productModel = await ProductModel.create({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      partNumber: normalizedPartNumber,
      createdBy: req.user._id,
    });

    res.status(201).json(productModel);
  } catch (error) {
    console.error('createProductModel error', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Datos inválidos para crear el modelo de producto.' });
    }
    res.status(500).json({ message: 'No se pudo crear el modelo de producto.' });
  }
};

exports.listProductModels = async (req, res) => {
  try {
    const models = await ProductModel.find().sort({ name: 1, partNumber: 1 });
    res.json(models);
  } catch (error) {
    console.error('listProductModels error', error);
    res.status(500).json({ message: 'No se pudieron obtener los modelos de producto.' });
  }
};
