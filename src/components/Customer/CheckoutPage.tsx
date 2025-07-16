// src/components/Customer/CheckoutPage.tsx (handlePlaceOrder improvement)
const handlePlaceOrder = async () => {
  // ... (validation)
  setLoading(true);
  try {
    const itemsByBusiness = items.reduce((acc, item) => {
      const businessId = item.product.business_id;
      if (!acc[businessId]) {
        acc[businessId] = [];
      }
      acc[businessId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    const orderPromises = Object.keys(itemsByBusiness).map(async (businessId) => {
      const businessItems = itemsByBusiness[businessId];
      const subtotal = businessItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalAmount = subtotal + 25; // Delivery fee per order

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          // ... order details
          business_id: businessId,
          order_total_amount: totalAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsToInsert = businessItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      return orderData;
    });

    const settledOrders = await Promise.allSettled(orderPromises);
    // ... (handle successful and failed orders)

    clearCart();
    navigate(`/order-confirmation/multiple`, { state: { orders: settledOrders } });

  } catch (e) {
    // ... error handling
  } finally {
    setLoading(false);
  }
};