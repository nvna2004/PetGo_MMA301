const Pet = require("../models/Pet");


const createPet = async (req, res) => {
  try {
    const { name, type, breed, weight, age, medicalNotes } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Please include pet name and type",
      });
    }

    let image = "no-pet-photo.jpg";
    if (req.file) {
      image = req.file.path.replace(/\\/g, "/"); 
    }

    const pet = await Pet.create({
      owner: req.user._id,
      name,
      type,
      breed,
      weight,
      age,
      medicalNotes,
      image,
    });

    res.status(201).json({
      success: true,
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getPets = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user._id });

    res.status(200).json({
      success: true,
      count: pets.length,
      pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getPet = async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, owner: req.user._id });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.status(200).json({
      success: true,
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updatePet = async (req, res) => {
  try {
    let pet = await Pet.findOne({ _id: req.params.id, owner: req.user._id });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    const { name, type, breed, weight, age, medicalNotes } = req.body;
    const updateData = { name, type, breed, weight, age, medicalNotes };

    if (req.file) {
      updateData.image = req.file.path.replace(/\\/g, "/");
    }

    pet = await Pet.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, owner: req.user._id });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    await pet.deleteOne();

    res.status(200).json({
      success: true,
      message: "Pet removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPet,
  getPets,
  getPet,
  updatePet,
  deletePet,
};
