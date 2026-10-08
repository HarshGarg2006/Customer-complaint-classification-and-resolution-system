from services.resolution import get_resolution


test_intents = [
    "cancel_order",
    "payment_issue",
    "track_order",
    "recover_password",
    "change_shipping_address",
    "get_refund",
    "contact_customer_service"
]


print("\n====================================")
print("RESOLUTION ENGINE TEST")
print("====================================")

for intent in test_intents:

    resolution = get_resolution(intent)

    print("\nIntent:", intent)
    print("Resolution:", resolution)

    print("------------------------------------")