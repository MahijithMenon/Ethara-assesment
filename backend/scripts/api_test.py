#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8000"


def post(path, obj):
    data = json.dumps(obj).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            print(r.status, r.read().decode())
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode())


if __name__ == "__main__":
    print("Create product:")
    post('/products', {"name": "Test Product", "sku": "TEST-001", "price": 9.50, "quantity_in_stock": 2})
    print('\nDuplicate SKU:')
    post('/products', {"name": "Test Product 2", "sku": "TEST-001", "price": 5.00, "quantity_in_stock": 1})
    print('\nCreate customer:')
    post('/customers', {"full_name": "Second User", "email": "test2@example.com", "phone_number": "555-0200"})
    print('\nDuplicate customer:')
    post('/customers', {"full_name": "Second User", "email": "test2@example.com", "phone_number": "555-0200"})
    print('\nAttempt large order (insufficient stock):')
    post('/orders', {"customer_id": 1, "items": [{"product_id": 1, "quantity": 100}]})
    print('\nPlace valid order (product by sku):')
    with urllib.request.urlopen(BASE + '/products') as r:
        products = json.load(r)
    pid = None
    for p in products:
        if p.get('sku') == 'TEST-001':
            pid = p['id']
    print('Using product id', pid)
    post('/orders', {"customer_id": 1, "items": [{"product_id": pid, "quantity": 1}]})
    print('\nGet product after order:')
    with urllib.request.urlopen(f"{BASE}/products/{pid}") as r:
        print(r.read().decode())
    print('\nList orders:')
    with urllib.request.urlopen(BASE + '/orders') as r:
        print(r.read().decode())
