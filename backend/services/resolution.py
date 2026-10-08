RESOLUTIONS = {

    "cancel_order":
        "Your order cancellation request has been identified. "
        "Please verify whether the order has already been dispatched. "
        "If it has not been dispatched, the order can be cancelled.",

    "change_order":
        "Your order modification request has been identified. "
        "Please check whether the order is still eligible for changes. "
        "If processing has not started, the required changes can be made.",

    "change_shipping_address":
        "Your request to change the shipping address has been identified. "
        "Please update the address before the order is dispatched. "
        "If the order has already shipped, contact customer support.",

    "check_cancellation_fee":
        "Your cancellation-fee inquiry has been identified. "
        "The applicable fee depends on the order status and cancellation timing.",

    "check_invoice":
        "You are requesting information about an invoice. "
        "Please check your account's invoice section or contact support.",

    "check_payment_methods":
        "You are asking about available payment methods. "
        "Please check the checkout page for the currently supported payment options.",

    "check_refund_policy":
        "You are asking about the refund policy. "
        "Please verify the refund eligibility and applicable terms for your order.",

    "complaint":
        "Your complaint has been recorded. "
        "Our support team should review the issue and provide an appropriate resolution.",

    "contact_customer_service":
        "Your request to contact customer service has been identified. "
        "Please use the customer support channel to connect with a representative.",

    "contact_human_agent":
        "Your request to speak with a human support agent has been identified. "
        "Please contact customer support to be connected with an agent.",

    "create_account":
        "To create an account, complete the registration form using your valid details "
        "and follow the account verification instructions.",

    "delete_account":
        "Your account deletion request has been identified. "
        "Please verify your identity before permanently deleting the account.",

    "delivery_options":
        "You are asking about delivery options. "
        "Available delivery methods and their estimated costs can be viewed during checkout.",

    "delivery_period":
        "You are asking about delivery time. "
        "The estimated delivery period depends on your location and selected delivery method.",

    "edit_account":
        "You can update supported personal information from your account settings.",

    "get_invoice":
        "You are requesting an invoice. "
        "Please check your order history or account invoice section to download it.",

    "get_refund":
        "Your refund request has been identified. "
        "Please verify that the order meets the refund eligibility requirements.",

    "newsletter_subscription":
        "You can manage newsletter subscription preferences from your account settings.",

    "payment_issue":
        "A payment issue has been identified. "
        "Please verify your payment details and try the transaction again. "
        "If the amount was deducted, avoid making repeated payments and contact support.",

    "place_order":
        "To place an order, select the required product, add it to your cart, "
        "provide the delivery details, and complete checkout.",

    "recover_password":
        "For password recovery, use the 'Forgot Password' option on the login page "
        "and follow the password-reset instructions.",

    "registration_problems":
        "A registration problem has been identified. "
        "Please verify the entered information and ensure all required fields are completed.",

    "review":
        "You can submit a review through the appropriate feedback or review section.",

    "set_up_shipping_address":
        "You can add a shipping address from your account or during checkout. "
        "Make sure the address details are complete and accurate.",

    "switch_account":
        "Please log out of the current account and sign in with the required account.",

    "track_order":
        "To track your order, open your order history and select the relevant order "
        "to view its current delivery status.",

    "track_refund":
        "Please check the refund status in your order or payment history. "
        "If the refund is delayed beyond the expected period, contact support."
}


def get_resolution(intent):
    return RESOLUTIONS.get(
        intent,
        "Your complaint has been received. "
        "Please contact customer support for further assistance."
    )