curl -X POST http://localhost:3000/api/v1/payments/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "236639506",
    "amount": 41.10,
    "country": "US",
    "date": "2025-03-14",
    "email": "ido.hengel@tipalti.com",
    "payment": {
      "cardholderName": "John Doe",
      "cardNumber": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "cvv": "123"
    }
}'