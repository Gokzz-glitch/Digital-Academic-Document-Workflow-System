const User = require('../models/User');
const DocumentType = require('../models/DocumentType');
const Request = require('../models/Request');
const { ErrorResponse } = require('../middleware/errorHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getAllUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) {
      const term = escapeRegex(req.query.search.trim());
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { rollNumber: { $regex: term, $options: 'i' } },
      ];
    }
    const users = await User.find(query).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    if (req.body.role === 'super_admin' && req.user.role !== 'super_admin') {
      return next(new ErrorResponse('Only a super administrator can create another super administrator', 403));
    }
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'student',
      department: req.body.department,
      year: req.body.year,
      section: req.body.section,
      rollNumber: req.body.rollNumber,
      phone: req.body.phone,
    });
    user.password = undefined; // Do not return password
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));
    const editableFields = ['name', 'email', 'department', 'year', 'section', 'rollNumber', 'phone'];
    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) user[field] = req.body[field];
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      if (req.user.role !== 'super_admin') {
        return next(new ErrorResponse('Only a super administrator can change user roles', 403));
      }
      user.role = req.body.role;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'password')) {
      return next(new ErrorResponse('Use the account password reset flow to change a password', 400));
    }
    await user.save();
    user.password = undefined;
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.createDocumentType = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const documentType = await DocumentType.create(req.body);
    res.status(201).json({ success: true, data: documentType });
  } catch (error) {
    next(error);
  }
};

exports.updateDocumentType = async (req, res, next) => {
  try {
    const documentType = await DocumentType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!documentType) return next(new ErrorResponse('Document Type not found', 404));
    res.status(200).json({ success: true, data: documentType });
  } catch (error) {
    next(error);
  }
};

exports.getDocumentTypes = async (req, res, next) => {
  try {
    const documentTypes = await DocumentType.find().sort('name');
    res.status(200).json({ success: true, count: documentTypes.length, data: documentTypes });
  } catch (error) {
    next(error);
  }
};

exports.getDocumentTypeById = async (req, res, next) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    if (!documentType) return next(new ErrorResponse('Document Type not found', 404));
    res.status(200).json({ success: true, data: documentType });
  } catch (error) {
    next(error);
  }
};

exports.toggleDocumentTypeStatus = async (req, res, next) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    if (!documentType) return next(new ErrorResponse('Document Type not found', 404));
    
    documentType.isActive = !documentType.isActive;
    await documentType.save();
    
    res.status(200).json({ success: true, data: documentType });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: { $in: ['submitted', 'in_review'] } });
    const completedRequests = await Request.countDocuments({ status: 'completed' });
    const activeDocTypes = await DocumentType.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRequests,
        pendingRequests,
        completedRequests,
        activeDocTypes
      }
    });
  } catch (error) {
    next(error);
  }
};
