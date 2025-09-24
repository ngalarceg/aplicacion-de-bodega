const mongoose = require('mongoose');
const Product = require('../models/Product');
const Assignment = require('../models/Assignment');
const DispatchGuide = require('../models/DispatchGuide');
const { findUserByAccount } = require('../services/activeDirectoryService');

const ALLOWED_STATUSES = ['AVAILABLE', 'ASSIGNED', 'DECOMMISSIONED'];

function buildSearchQuery({ type, status, search }) {
  const query = {};

  if (type && ['PURCHASED', 'RENTAL'].includes(type)) {
    query.type = type;
  }

  if (status) {
    const statusValues = status
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => ALLOWED_STATUSES.includes(value));

    if (statusValues.length === 1) {
      query.status = statusValues[0];
    } else if (statusValues.length > 1) {
      query.status = { $in: statusValues };
    }
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { name: regex },
      { serialNumber: regex },
      { partNumber: regex },
      { inventoryNumber: regex },
      { rentalId: regex },
    ];
  }

  return query;
}

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      serialNumber,
      partNumber,
      inventoryNumber,
      rentalId,
      dispatchGuideId,
    } = req.body;

    if (!name || !type || !serialNumber || !partNumber) {
      return res.status(400).json({ message: 'Nombre, tipo, número de serie y número de parte son obligatorios.' });
    }

    if (!['PURCHASED', 'RENTAL'].includes(type)) {
      return res.status(400).json({ message: 'Tipo de producto inválido.' });
    }

    if (type === 'RENTAL' && !rentalId) {
      return res.status(400).json({ message: 'Los productos de arriendo requieren un ID de arriendo.' });
    }

    if (!dispatchGuideId) {
      return res.status(400).json({ message: 'Debes asociar el producto a una guía de despacho.' });
    }

    if (type === 'PURCHASED' && !inventoryNumber) {
      // El inventario es opcional, pero avisamos si falta.
      console.warn('Producto de compra sin número de inventario, se almacenará vacío.');
    }

    if (!mongoose.Types.ObjectId.isValid(dispatchGuideId)) {
      return res.status(400).json({ message: 'Identificador de guía de despacho inválido.' });
    }

    const dispatchGuide = await DispatchGuide.findById(dispatchGuideId);
    if (!dispatchGuide) {
      return res.status(404).json({ message: 'Guía de despacho no encontrada.' });
    }

    const product = await Product.create({
      name,
      description,
      type,
      serialNumber,
      partNumber,
      inventoryNumber: type === 'PURCHASED' ? inventoryNumber || null : undefined,
      rentalId: type === 'RENTAL' ? rentalId : undefined,
      dispatchGuide: dispatchGuide._id,
      createdBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('createProduct error', error);
    res.status(500).json({ message: 'No se pudo crear el producto.' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const query = buildSearchQuery(req.query);
    const products = await Product.find(query)
      .populate('dispatchGuide')
      .populate('decommissionedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('listProducts error', error);
    res.status(500).json({ message: 'No se pudieron obtener los productos.' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const product = await Product.findById(req.params.id)
      .populate('dispatchGuide')
      .populate('decommissionedBy', 'name email role');
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.json(product);
  } catch (error) {
    console.error('getProduct error', error);
    res.status(500).json({ message: 'No se pudo obtener el producto.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const allowedUpdates = [
      'name',
      'description',
      'serialNumber',
      'partNumber',
      'inventoryNumber',
      'rentalId',
      'dispatchGuideId',
    ];

    const updates = Object.keys(req.body).filter((key) => allowedUpdates.includes(key));

    if (!updates.length) {
      return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    for (const key of updates) {
      if (key === 'dispatchGuideId') {
        const dispatchGuideId = req.body.dispatchGuideId;
        if (!dispatchGuideId) {
          return res.status(400).json({ message: 'Los productos deben permanecer asociados a una guía de despacho.' });
        }
        if (!mongoose.Types.ObjectId.isValid(dispatchGuideId)) {
          return res.status(400).json({ message: 'Identificador de guía de despacho inválido.' });
        }
        const dispatchGuide = await DispatchGuide.findById(dispatchGuideId);
        if (!dispatchGuide) {
          return res.status(404).json({ message: 'Guía de despacho no encontrada.' });
        }
        product.dispatchGuide = dispatchGuide._id;
      } else {
        product[key] = req.body[key];
      }
    }

    await product.save();

    res.json(product);
  } catch (error) {
    console.error('updateProduct error', error);
    res.status(500).json({ message: 'No se pudo actualizar el producto.' });
  }
};

exports.assignProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const { assignedTo, assignedToAdAccount, location, assignmentDate, notes } = req.body;

    if (!assignedTo || !assignedToAdAccount || !location) {
      return res.status(400).json({ message: 'Usuario, cuenta de Active Directory y ubicación son obligatorios.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (product.status === 'DECOMMISSIONED') {
      return res.status(400).json({ message: 'El producto está dado de baja y no puede asignarse.' });
    }

    const adUser = findUserByAccount(assignedToAdAccount);
    if (!adUser) {
      return res.status(400).json({ message: 'La cuenta de Active Directory no existe en el directorio simulado.' });
    }

    const effectiveAssignmentDate = assignmentDate ? new Date(assignmentDate) : new Date();

    const assignment = await Assignment.create({
      product: product._id,
      action: 'ASSIGN',
      assignedTo,
      assignedToAdAccount: adUser.adAccount,
      location,
      assignmentDate: effectiveAssignmentDate,
      performedBy: req.user._id,
      notes,
    });

    product.currentAssignment = {
      assignedTo,
      assignedToAdAccount: adUser.adAccount,
      location,
      assignmentDate: effectiveAssignmentDate,
    };

    product.status = 'ASSIGNED';
    product.decommissionReason = undefined;
    product.decommissionedAt = undefined;
    product.decommissionedBy = undefined;

    await product.save();

    res.json({ product, assignment });
  } catch (error) {
    console.error('assignProduct error', error);
    res.status(500).json({ message: 'No se pudo asignar el producto.' });
  }
};

exports.unassignProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const { location, assignmentDate, notes } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (product.status === 'DECOMMISSIONED') {
      return res.status(400).json({ message: 'El producto se encuentra dado de baja.' });
    }

    if (!product.currentAssignment) {
      return res.status(400).json({ message: 'El producto no tiene una asignación activa.' });
    }

    const effectiveAssignmentDate = assignmentDate ? new Date(assignmentDate) : new Date();

    const assignment = await Assignment.create({
      product: product._id,
      action: 'UNASSIGN',
      assignedTo: product.currentAssignment.assignedTo,
      assignedToAdAccount: product.currentAssignment.assignedToAdAccount,
      location: location || product.currentAssignment.location,
      assignmentDate: effectiveAssignmentDate,
      performedBy: req.user._id,
      notes,
    });

    product.currentAssignment = undefined;
    product.status = 'AVAILABLE';
    await product.save();

    res.json({ product, assignment });
  } catch (error) {
    console.error('unassignProduct error', error);
    res.status(500).json({ message: 'No se pudo desasignar el producto.' });
  }
};

exports.decommissionProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Debes indicar el motivo de la baja.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (product.status === 'DECOMMISSIONED') {
      return res.status(400).json({ message: 'El producto ya se encuentra dado de baja.' });
    }

    if (product.currentAssignment) {
      return res
        .status(400)
        .json({ message: 'Debes liberar la asignación antes de dar de baja el producto.' });
    }

    product.currentAssignment = undefined;
    product.status = 'DECOMMISSIONED';
    product.decommissionReason = reason.trim();
    product.decommissionedAt = new Date();
    product.decommissionedBy = req.user._id;

    await product.save();

    const populated = await product
      .populate('dispatchGuide')
      .populate('decommissionedBy', 'name email role');

    res.json(populated);
  } catch (error) {
    console.error('decommissionProduct error', error);
    res.status(500).json({ message: 'No se pudo dar de baja el producto.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (product.currentAssignment || product.status === 'ASSIGNED') {
      return res.status(400).json({ message: 'Debes liberar el producto antes de eliminarlo.' });
    }

    await Assignment.deleteMany({ product: product._id });
    await product.deleteOne();

    res.status(204).send();
  } catch (error) {
    console.error('deleteProduct error', error);
    res.status(500).json({ message: 'No se pudo eliminar el producto.' });
  }
};

exports.getAssignmentHistory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const assignments = await Assignment.find({ product: req.params.id })
      .populate('performedBy', 'name email role')
      .sort({ assignmentDate: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('getAssignmentHistory error', error);
    res.status(500).json({ message: 'No se pudo obtener el historial de asignaciones.' });
  }
};
