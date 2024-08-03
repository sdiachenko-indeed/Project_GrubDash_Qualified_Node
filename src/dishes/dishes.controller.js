const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({
          status: 400,
          message: `Must include a ${propertyName}`
      });
    };
  }

function bodyDataNotEmpty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] !== "") {
            return next();
        }
        next({
            status: 400,
            message: `${propertyName} must not be empty`
        });
    };
}

function priceNotZero() {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data["price"] > 0) {
            return next();
        }
        next({
            status: 400,
            message: `Property "price" must not be ZERO`
        });
    };
}

function priceNotNumber() {
    return function (req, res, next) {
        const { data = {} } = req.body;
        const price = data["price"]
        if (typeof price === "number") {
            return next();
        }
        next({
            status: 400,
            message: `Property "price" must be a number`
        });
    };
}

// TODO: Implement the /dishes handlers needed to make the tests pass
function create(req, res) {
    const {data: {name, description, price, image_url}} = req.body;
    const newDish = {
        id: nextId(),
        name,
        description, 
        price, 
        image_url
    };
    dishes.push(newDish)
    res.status(201).json({data: newDish})
}

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
  };

function read(req, res) {
    const dishId = req.params.dishId;
    res.json({ data: res.locals.dish });
}

function update(req, res, next) {
    const { dishId } = req.params;
    const { data: { id, name, description, price, image_url } = {} } = req.body;

    if (id && id !== dishId) {
        return next({
            status: 400,
            message: `Dish id does not match route id. id: ${id}, route id: ${dishId}`,
        });
    }

    const index = dishes.findIndex(dish => dish.id === dishId);
    if (index === -1) {
        return next({
            status: 404,
            message: `Dish not found: ${dishId}`,
        });
    }

    const updatedDish = {
        id: dishId,
        name: name,
        description: description,
        price: price,
        image_url: image_url
    };

    dishes[index] = updatedDish;
    res.json({ data: updatedDish });
  }

function list(req, res) { 
    res.json({data: dishes})
}

module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceNotZero(),
        bodyDataNotEmpty("name"),
        bodyDataNotEmpty("description"),
        bodyDataNotEmpty("image_url"),
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists, 
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceNotZero(),
        priceNotNumber(),
        bodyDataNotEmpty("name"),
        bodyDataNotEmpty("description"),
        bodyDataNotEmpty("image_url"),
        update
    ]
}