let products = [];
let currentPage = 1;
let itemsPerPage = 5;
let totalPages = 0;
let currentProductId = null;
let currentViewProducts = [];

fetch('https://api.escuelajs.co/api/v1/products')
    .then(response => response.json())
    .then(data => {
        products = data;
        totalPages = Math.ceil(products.length / itemsPerPage);
        displayProducts(products);
    })
    .catch(error => console.error('Error fetching data:', error));

function displayProducts(productsToDisplay) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = productsToDisplay.slice(start, end);

    currentViewProducts = paginatedProducts;

    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        row.classList.add('product-row');

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td>${product.category?.name || ''}</td>

            <td class="tooltip-cell">
                <img src="${product.images?.[0] || ''}" 
                        class="img-thumbnail product-img">

                <div class="product-tooltip">
                    <strong>Description</strong>
                    <hr style="border-color: rgba(255,255,255,0.2)">
                    ${product.description}
                </div>
            </td>

            <td>
                <button class="btn btn-sm btn-info"
                    onclick="viewProductDetail(${product.id})">
                    View
                </button>
            </td>
        `;
        productList.appendChild(row);
    });

    updatePaginationControls();
}

function updatePaginationControls() {
    document.getElementById('page-number').innerText = `Page ${currentPage}`;
}

function changePage(direction) {
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    displayProducts(products);
}

function searchProducts() {
    const keyword = document.getElementById('search').value.toLowerCase();
    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(keyword)
    );
    currentPage = 1;
    displayProducts(filtered);
}

function sortProducts(by) {
    const sorted = [...products];
    if (by === 'price') {
        sorted.sort((a, b) => a.price - b.price);
    } else {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    displayProducts(sorted);
}

function viewProductDetail(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentProductId = id;

    document.getElementById('detail-title').value = product.title;
    document.getElementById('detail-price').value = product.price;
    document.getElementById('detail-description').innerText = product.description;

    $('#detailModal').modal('show');
}

function updateProduct() {
    const title = document.getElementById('detail-title').value;
    const price = Number(document.getElementById('detail-price').value);

    fetch(`https://api.escuelajs.co/api/v1/products/${currentProductId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, price })
    })
        .then(res => res.json())
        .then(updated => {
            const index = products.findIndex(p => p.id === currentProductId);
            if (index === -1) return;

            products[index] = {
                ...products[index],
                ...updated
            };

            displayProducts(products);
            $('#detailModal').modal('hide');
        })
        .catch(err => console.error('Update error:', err));
}

document.getElementById('create-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const newProduct = {
        title: document.getElementById('create-title').value,
        price: Number(document.getElementById('create-price').value),
        description: document.getElementById('create-description').value,
        categoryId: 1,
        images: [document.getElementById('create-image').value]
    };

    fetch('https://api.escuelajs.co/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    })
        .then(res => res.json())
        .then(data => {
            products.unshift(data);
            displayProducts(products);
            $('#createModal').modal('hide');
        })
        .catch(err => console.error('Create error:', err));
});


function exportCSV() {
    if (currentViewProducts.length === 0) {
        alert("No data to export");
        return;
    }

    const headers = ["ID", "Title", "Price", "Category", "Description"];
    const rows = currentViewProducts.map(p => [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        p.price,
        `"${p.category?.name || ''}"`,
        `"${p.description.replace(/"/g, '""')}"`
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "products_view.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}