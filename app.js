let listProductHTML = document.querySelector('.listProduct');
let listCartHTML = document.querySelector('.listCart');
let iconCart = document.querySelector('.icon-cart');
let iconCartSpan = document.querySelector('.icon-cart span');
let body = document.querySelector('body');
let closeCart = document.querySelector('.close');
let products = [];
let cart = [];


iconCart.addEventListener('click', () => {
    body.classList.toggle('showCart');
})
closeCart.addEventListener('click', () => {
    body.classList.toggle('showCart');
})

    const addDataToHTML = () => {
    // remove datas default from HTML

        // add new datas
        if(products.length > 0) // if has data
        {
            products.forEach(product => {
                let newProduct = document.createElement('div');
                newProduct.dataset.id = product.id;
                newProduct.classList.add('item');
                newProduct.innerHTML = 
                `<img src="${product.image}" alt="">
                <h2>${product.name}</h2>
                <div class="price">$${product.price}</div>   
                <button class="addCart">Añadir al carrito</button>`;
                listProductHTML.appendChild(newProduct);
            });
        }
    }
    listProductHTML.addEventListener('click', (event) => {
        let positionClick = event.target;
        if(positionClick.classList.contains('addCart')){
            let id_product = positionClick.parentElement.dataset.id;
            addToCart(id_product);
        }
    })
const addToCart = (product_id) => {
    let positionThisProductInCart = cart.findIndex((value) => value.product_id == product_id);
    if(cart.length <= 0){
        cart = [{
            product_id: product_id,
            quantity: 1
        }];
    }else if(positionThisProductInCart < 0){
        cart.push({
            product_id: product_id,
            quantity: 1
        });
    }else{
        cart[positionThisProductInCart].quantity = cart[positionThisProductInCart].quantity + 1;
    }
    addCartToHTML();
    addCartToMemory();
}
const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
}


const formatPrice = (value) => {
    return value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0 // para que no muestre ,00
    });
};


const addCartToHTML = () => {
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;

    if(cart.length > 0){
        cart.forEach(item => {
            totalQuantity += item.quantity;
            let newItem = document.createElement('div');
            newItem.classList.add('item');
            newItem.dataset.id = item.product_id;

            let positionProduct = products.findIndex((value) => value.id == item.product_id);
            let info = products[positionProduct];

            // Acumular el precio total
            totalPrice += info.price * item.quantity;

            newItem.innerHTML = `
                <div class="image">
                    <img src="${info.image}">
                </div>
                <div class="name">${info.name}</div>
                <div class="totalPrice">${formatPrice(info.price * item.quantity)}</div>
                <div class="quantity">
                    <span class="minus"><</span>
                    <span>${item.quantity}</span>
                    <span class="plus">></span>
                </div>
            `;
            listCartHTML.appendChild(newItem);
        });
    }

    // Actualizar contador de ícono
    iconCartSpan.innerText = totalQuantity > 0 ? totalQuantity : 0;

    // 🔥 Actualizar el total en el carrito
    const totalAmount = document.querySelector('.totalAmount');
    if(totalAmount){
        totalAmount.textContent = formatPrice(totalPrice);
    }
};

listCartHTML.addEventListener('click', (event) => {
    let positionClick = event.target;
    if(positionClick.classList.contains('minus') || positionClick.classList.contains('plus')){
        let product_id = positionClick.parentElement.parentElement.dataset.id;
        let type = 'minus';
        if(positionClick.classList.contains('plus')){
            type = 'plus';
        }
        changeQuantityCart(product_id, type);
    }
})
const changeQuantityCart = (product_id, type) => {
    let positionItemInCart = cart.findIndex((value) => value.product_id == product_id);
    if(positionItemInCart >= 0){
        let info = cart[positionItemInCart];
        switch (type) {
            case 'plus':
                cart[positionItemInCart].quantity = cart[positionItemInCart].quantity + 1;
                break;
        
            default:
                let changeQuantity = cart[positionItemInCart].quantity - 1;
                if (changeQuantity > 0) {
                    cart[positionItemInCart].quantity = changeQuantity;
                }else{
                    cart.splice(positionItemInCart, 1);
                }
                break;
        }
    }
    addCartToHTML();
    addCartToMemory();
}

const initApp = () => {
    // get data product
    fetch('products.json')
    .then(response => response.json())
    .then(data => {
        products = data;
        addDataToHTML();

        // get data cart from memory
        if(localStorage.getItem('cart')){
            cart = JSON.parse(localStorage.getItem('cart'));
            addCartToHTML();
        }
    })
}
initApp();


// Mostrar u ocultar campo de dirección según tipo de entrega
const deliveryTypeSelect = document.getElementById('deliveryType');
const addressField = document.getElementById('addressField');

deliveryTypeSelect.addEventListener('change', () => {
    if (deliveryTypeSelect.value === 'Domicilio') {
        addressField.style.display = 'block';
    } else {
        addressField.style.display = 'none';
    }
});


// Seleccionar botón de checkout
let checkOutButton = document.querySelector('.checkOut');

checkOutButton.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Tu carrito está vacío");
        return;
    }

    // Obtener datos del formulario
    let clientName = document.getElementById('clientName').value.trim();
    let clientPhone = document.getElementById('clientPhone').value.trim();
    let paymentMethod = document.getElementById('paymentMethod').value;
    let deliveryType = document.getElementById('deliveryType').value;
    let clientAddress = document.getElementById('clientAddress').value.trim();

    if (!clientName || !clientPhone) {
        alert("Por favor, completa tu nombre y teléfono.");
        return;
    }
    if (deliveryType === "Domicilio" && !clientAddress) {
        alert("Por favor, ingresa tu dirección.");
        return;
    }

    let message = `¡Hola! Quiero realizar mi pedido:%0A`;
    message += `👤 Nombre: ${clientName}%0A📞 Teléfono: ${clientPhone}%0A💳 Pago: ${paymentMethod}%0A🚚 Entrega: ${deliveryType}%0A`;
    if (deliveryType === "Domicilio") {
        message += `📍 Dirección: ${clientAddress}%0A`;
    }
    message += `%0A--- Productos --- %0A`;

    cart.forEach(item => {
        let product = products.find(p => p.id == item.product_id);
        message += `• ${product.name} x${item.quantity} - ${formatPrice(product.price * item.quantity)}%0A`;
    });

    let total = cart.reduce((sum, item) => {
        let product = products.find(p => p.id == item.product_id);
        return sum + (product.price * item.quantity);
    }, 0);

    message += `%0A*Total: ${formatPrice(total)}*`;

    let phoneNumber = "573246394689"; 
    let url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, "_blank");

    // Vaciar carrito y almacenamiento
    cart = [];
    localStorage.removeItem('cart');
    addCartToHTML();
});
