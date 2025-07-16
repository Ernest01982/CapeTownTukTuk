import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Target, Package, DollarSign, Zap, Navigation, Phone } from 'lucide-react';

import { useAppContext } from '../../context/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase, Order } from '../../lib/supabase';

// Custom icon for the driver's marker
const driverIcon = new Icon({
  iconUrl: '/vite.svg', // You can replace this with a custom TukTuk icon
  iconSize: [40, 40],
});

export function DriverDashboard() {
  const { auth } = useAppContext();
  const { profile } = auth;
  const { latitude, longitude, error: geoError } = useGeolocation();

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // This effect fetches orders and sets up a subscription
  useEffect(() => {
    if (profile) {
      fetchMyOrders();
      const subscription = supabase
        .channel('driver-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `driver_id=eq.${profile.id}` },
          () => fetchMyOrders()
        )
        .subscribe();
      return () => { subscription.unsubscribe(); };
    }
  }, [profile]);

  // This effect updates the driver's location in the database every 15 seconds
  useEffect(() => {
    if (isOnline && latitude && longitude && profile) {
      const intervalId = setInterval(() => {
        updateDriverLocationInDb(latitude, longitude);
      }, 15000); // Update every 15 seconds

      return () => clearInterval(intervalId);
    }
  }, [isOnline, latitude, longitude, profile]);

  const fetchMyOrders = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`*, business:businesses(business_name), customer:profiles!orders_customer_id_fkey(*)`)
        .eq('driver_id', profile.id)
        .in('order_status', ['Ready_for_Pickup', 'Out_for_Delivery']);
      
      if (error) throw error;
      setMyOrders(data || []);
    } catch (err) {
      console.error("Error fetching driver's orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateDriverLocationInDb = async (lat: number, lng: number) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          // Format for PostGIS geography type: POINT(lng lat)
          last_location: `POINT(${lng} ${lat})` 
        })
        .eq('id', profile.id);

      if (error) {
        console.error("Error updating driver location:", error);
      } else {
        console.log("Driver location updated successfully.");
      }
    } catch (err) {
      console.error("DB update failed:", err);
    }
  };

  const hasLocation = latitude !== 0 && longitude !== 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </span>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`p-1 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
            </button>
          </div>
        </div>

        {geoError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{geoError}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map View */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center"><MapPin className="mr-2 h-5 w-5 text-blue-500"/> Live Map</h2>
            <div className="h-96 rounded-lg overflow-hidden">
              {hasLocation ? (
                <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[latitude, longitude]} icon={driverIcon}>
                    <Popup>You are here.</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                  {geoError ? "Could not get location" : "Getting your location..."}
                </div>
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 flex items-center"><Target className="mr-2 h-5 w-5 text-orange-500" /> My Deliveries ({myOrders.length})</h2>
                {loading ? (
                    <p>Loading orders...</p>
                ) : myOrders.length === 0 ? (
                    <p className="text-gray-500">No active deliveries. Go online to find orders!</p>
                ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {myOrders.map(order => (
                            <div key={order.id} className="border p-3 rounded-lg bg-gray-50">
                                <p className="font-semibold">{order.business?.business_name}</p>
                                <p className="text-sm text-gray-600 truncate">{order.delivery_address_text}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-xs font-bold p-1 rounded ${order.order_status === 'Ready_for_Pickup' ? 'bg-yellow-200' : 'bg-blue-200'}`}>{order.order_status.replace('_', ' ')}</span>
                                    <div className="flex space-x-2">
                                        <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"><Navigation className="h-4 w-4"/></button>
                                        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><Phone className="h-4 w-4"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}