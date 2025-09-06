document.addEventListener('DOMContentLoaded', () => {
  const listProductHTML = document.querySelector('.listProduct');
  const listCartHTML = document.querySelector('.listCart');
  const iconCart = document.querySelector('.icon-cart');
  const iconCartSpan = document.querySelector('.icon-cart span');
  const body = document.body;
  const closeCart = document.querySelector('.close');

  let products = [];
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  const formatPrice = (v) =>
    v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  const addCartToMemory = () => localStorage.setItem('cart', JSON.stringify(cart));

  const addDataToHTML = () => {
    if (!listProductHTML) return;
    listProductHTML.innerHTML = '';
    if (!products.length) return;

    products.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.dataset.id = p.id;
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h2 title="${p.name}">${p.name}</h2>
        <div class="price">${formatPrice(p.price)}</div>
        <button class="addCart" type="button">Añadir al carrito</button>
      `;
      listProductHTML.appendChild(div);
    });
  };

  const addCartToHTML = () => {
    if (!listCartHTML) return;
    listCartHTML.innerHTML = '';

    let totalQuantity = 0;
    let totalPrice = 0;

    cart.forEach(({ product_id, quantity }) => {
      const info = products.find((p) => String(p.id) === String(product_id));
      if (!info) return;

      totalQuantity += quantity;
      totalPrice += info.price * quantity;

      const item = document.createElement('div');
      item.className = 'item';
      item.dataset.id = product_id;
      item.innerHTML = `
        <div class="image"><img src="${info.image}" alt="${info.name}"></div>
        <div class="name">${info.name}</div>
        <div class="totalPrice">${formatPrice(info.price * quantity)}</div>
        <div class="quantity">
          <span class="minus">-</span>
          <span>${quantity}</span>
          <span class="plus">+</span>
        </div>
      `;
      listCartHTML.appendChild(item);
    });

    if (iconCartSpan) iconCartSpan.textContent = totalQuantity || 0;

    const totalAmount = document.querySelector('.totalAmount');
    if (totalAmount) totalAmount.textContent = formatPrice(totalPrice);
  };

  const addToCart = (product_id) => {
    product_id = String(product_id);
    const index = cart.findIndex((i) => String(i.product_id) === product_id);
    if (index === -1) {
      cart.push({ product_id, quantity: 1 });
    } else {
      cart[index].quantity += 1;
    }
    addCartToHTML();
    addCartToMemory();
  };

  const changeQuantityCart = (product_id, type) => {
    const i = cart.findIndex((v) => String(v.product_id) === product_id);
    if (i === -1) return;

    if (type === 'plus') {
      cart[i].quantity += 1;
    } else {
      cart[i].quantity -= 1;
      if (cart[i].quantity <= 0) cart.splice(i, 1);
    }
    addCartToHTML();
    addCartToMemory();
  };

  // Delegación: Añadir al carrito
  listProductHTML?.addEventListener('click', (e) => {
    const btn = e.target.closest('.addCart');
    if (!btn) return;
    const id = btn.closest('.item')?.dataset.id;
    if (id) addToCart(id);
  });

  // Delegación: +/-
  listCartHTML?.addEventListener('click', (e) => {
    const isMinus = e.target.classList.contains('minus');
    const isPlus = e.target.classList.contains('plus');
    if (!isMinus && !isPlus) return;
    const id = e.target.closest('.item')?.dataset.id;
    if (id) changeQuantityCart(id, isPlus ? 'plus' : 'minus');
  });

  // Mostrar/ocultar carrito
  iconCart?.addEventListener('click', () => body.classList.toggle('showCart'));
  closeCart?.addEventListener('click', () => body.classList.toggle('showCart'));

  // Init productos
  const pageCategory =
    document.body.dataset.category ||
    document.querySelector('[data-category]')?.dataset.category ||
    '';

  fetch('products.json')
    .then((r) => r.json())
    .then((data) => {
      products = pageCategory ? data.filter((p) => String(p.category) === String(pageCategory)) : data;
      addDataToHTML();
      addCartToHTML();
    })
    .catch((err) => {
      console.error('Error cargando products.json', err);
    });

  // --- Checkout WhatsApp ---
  const deliveryTypeSelect = document.getElementById('deliveryType');
  const addressField = document.getElementById('addressField');
  deliveryTypeSelect?.addEventListener('change', () => {
    addressField.style.display = deliveryTypeSelect.value === 'Domicilio' ? 'block' : 'none';
  });

  const checkOutButton = document.querySelector('.checkOut');
  checkOutButton?.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const deliveryType = document.getElementById('deliveryType').value;
    const clientAddress = document.getElementById('clientAddress').value.trim();

    if (!clientName || !clientPhone) {
      alert('Por favor, completa tu nombre y teléfono.');
      return;
    }
    if (deliveryType === 'Domicilio' && !clientAddress) {
      alert('Por favor, ingresa tu dirección.');
      return;
    }

    let message = `¡Hola! Quiero realizar mi pedido:%0A`;
    message += `👤 Nombre: ${clientName}%0A📞 Teléfono: ${clientPhone}%0A💳 Pago: ${paymentMethod}%0A🚚 Entrega: ${deliveryType}%0A`;
    if (deliveryType === 'Domicilio') {
      message += `📍 Dirección: ${clientAddress}%0A`;
    }
    message += `%0A--- Productos --- %0A`;

    cart.forEach((item) => {
      const product = products.find((p) => String(p.id) === String(item.product_id));
      if (product) {
        message += `• ${product.name} x${item.quantity} - ${formatPrice(product.price * item.quantity)}%0A`;
      }
    });

    const total = cart.reduce((sum, item) => {
      const product = products.find((p) => String(p.id) === String(item.product_id));
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    message += `%0A*Total: ${formatPrice(total)}*`;

    const phoneNumber = '573246394689'; // 📱 tu número
    const url = `https://wa.me/${phoneNumber}?text=${message}`;

    // Limpiar form
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('paymentMethod').selectedIndex = 0;
    document.getElementById('deliveryType').selectedIndex = 0;
    document.getElementById('clientAddress').value = '';
    document.getElementById('addressField').style.display = 'none';

    // Vaciar carrito
    cart = [];
    localStorage.removeItem('cart');
    addCartToHTML();

    // Ir a WhatsApp
    window.location.href = url;
  });

  // --- Opcional: menú móvil y dropdown ---
  const menuToggle = document.getElementById('menu-toggle');
  const navbar = document.querySelector('.navbar');
  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', () => navbar.classList.toggle('active'));
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) {
        navbar.classList.remove('active');
      }
    });
  }

  const productLink = document.querySelector('.nav-links li:nth-child(2) a');
  if (productLink) {
    productLink.addEventListener('click', (e) => {
      e.preventDefault();
      const existingDropdown = document.querySelector('.dropdown-menu');
      if (existingDropdown) return existingDropdown.remove();

      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown-menu';
      dropdown.innerHTML = `
        <a href="#">Premium Plans</a>
        <a href="#">Exclusive Deals</a>
        <a href="#">New Arrivals</a>
      `;
      productLink.parentNode.appendChild(dropdown);
    });
  }
});
 
