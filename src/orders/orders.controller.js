const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
// create, read, update, delete, and list
function dataIsValid(req, res, next){
    const { data: { deliverTo, mobileNumber, dishes,  status} } = req.body;

    if(Array.isArray(dishes)) {
        const hasInvalidQuantity = dishes.some((dish) => typeof (dish.quantity) !== "number" || dish.quantity <= 0)
        if (hasInvalidQuantity) {
            return next({
                status: 400,
                message: `Please put valid quantity such as 0, 1, 2`
            });
        }
    } else {
        return next({
            status: 400,
            message: `dish is missing`
        });
    }

    if (deliverTo === "" || mobileNumber === "" || dishes.length < 1 || status === "invalid") {
        return next({
            status: 400,
            message: `Please check dish deliverTo mobileNumber status prop`
        });
    }
    next();
}

function updateDataIsValid(req, res, next) {
    const { orderId } = req.params;
    const { data: { status, id } = {} } = req.body;
    const orderStatus = orders.find((order) => order.id === orderId);
    if (id && id !== orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. id: ${id}, route id: ${orderId}`,
        });
    }
    if (!orderStatus) {
        return next({
            status: 404,
            message: `Order not found: ${orderId}`,
        });
    }
    if (status === "" || orderStatus.status === "delivered") {
        return next({
            status: 400,
            message: `Cannot update order because status cannot be updated. orderStatus: ${orderStatus.status}`,
        });
    }
    next();
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        if(propertyName === "quantity") {
            const {data = { dishes: {}}} = req.body;
            if (data.dishes[0].quantity) {
                return next();
            }
        }

        const {data = {}} = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    };
}


function orderExists(req, res, next) {
    const { orderId } = req.params;
    const { data: { id  } = {} } = req.body;
    const orderById = orders.filter((order) => order.id === orderId)
    if (orderById.length > 0 || id === orderId) {
        res.locals.order = orderById;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
}

function deleteDataIsValid(req, res, next){
    const { orderId } = req.params;
    const { data: { status } = {} } = req.body;
    const orderStatus = orders.filter((order) => order.id === orderId)
    if (orderStatus[0].status !== "pending") {
        return next({
            status: 400,
            message: `Cannot delete order because status !== pending`
        });
    }
    next();
}

function list(req, res) {
    res.json({ data: orders });
}

function read(req, res) {
    const order = res.locals.order;
    res.json({ data: order[0] });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes
    };

    orders.push(newOrder)
    res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
    const { orderId } = req.params;
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    if (id && id !== orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. id: ${id}, route id: ${orderId}`,
        });
    }

    const index = orders.findIndex(order => order.id === orderId);
    if (index === -1) {
        return next({
            status: 404,
            message: `Order not found: ${orderId}`,
        });
    }

    const updatedOrder = {
        id: orderId,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes
    };

    orders[index] = updatedOrder;
    res.json({ data: updatedOrder });
}


function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedPastes = orders.splice(index, 1);
    res.sendStatus(204);
}
module.exports = {
    list,
    create:[
        dataIsValid,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("quantity"),
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        dataIsValid,
        updateDataIsValid,
        update
    ],
    delete: [orderExists, deleteDataIsValid, destroy],
};