import React, { useState, useEffect, useRef } from 'react';
import { 
  Utensils, 
  Clock, 
  MapPin, 
  Phone, 
  Menu as MenuIcon, 
  X, 
  Star, 
  ChevronRight, 
  ShoppingBag,
  Heart,
  Calendar,
  CheckCircle2,
  Trash2,
  Users,
  UtensilsCrossed,
  Lock,
  LogOut,
  KeyRound,
  ShieldAlert,
  BellRing
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const MENU_CATEGORIES = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];

const MENU_ITEMS = [
  {
    id: 1,
    name: 'Truffle & Wild Mushroom Risotto',
    category: 'Mains',
    price: 24.50,
    description: 'Arborio rice slow-cooked with fresh seasonal wild mushrooms, finished with black truffle oil and Aged Parmesan.',
    image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 2,
    name: 'Pan-Seared Atlantic Salmon',
    category: 'Mains',
    price: 28.00,
    description: 'Crispy skin salmon served over roasted asparagus, potato puree, and a citrus herb beurre blanc.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 3,
    name: 'Burrata Caprese Salad',
    category: 'Starters',
    price: 16.00,
    description: 'Fresh Italian burrata, heirloom tomatoes, basil pest oil, aged balsamic glaze, and grilled sourdough.',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1626d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 4,
    name: 'Prime Wagyu Ribeye (10oz)',
    category: 'Mains',
    price: 45.00,
    description: 'Grilled to perfection, served with garlic herb butter, roasted bone marrow, and rosemary fries.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 5,
    name: 'Signature Chocolate Soufflé',
    category: 'Desserts',
    price: 12.50,
    description: 'Warm Valrhona dark chocolate soufflé served with house-made Madagascar vanilla bean gelato.',
    image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 6,
    name: 'Smoked Craft Old Fashioned',
    category: 'Drinks',
    price: 15.00,
    description: 'Small-batch bourbon, Angostura bitters, orange peel, smoked with hickory wood smoke at your table.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600',
  },
];

export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderNotification, setOrderNotification] = useState('');

  // Admin Access
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Dynamic Server State
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminTab, setAdminTab] = useState('reservations');
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  // Refs for sound & order count tracking
  const prevOrdersCountRef = useRef(null);

  // Client Reservation Form State
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: '2',
  });
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // --- PLAY AUDIO CHIME ---
  const playSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (err) {
      console.log("Audio context blocked", err);
    }
  };

  // --- Fetch Data & Trigger Sound ONLY IF Admin is Logged In ---
  const fetchLocalData = async () => {
    try {
      const [resData, ordData] = await Promise.all([
        fetch(`${API_BASE_URL}/reservations`).then(r => r.json()),
        fetch(`${API_BASE_URL}/orders`).then(r => r.json())
      ]);

      setReservations(resData);

      // ONLY check for new order sound/alert if the manager is currently logged in
      if (isAdminLoggedIn) {
        if (prevOrdersCountRef.current === null) {
          prevOrdersCountRef.current = ordData.length;
        } else if (ordData.length > prevOrdersCountRef.current) {
          playSound();
          setNewOrderAlert(true);
          prevOrdersCountRef.current = ordData.length;
        }
      } else {
        // Reset baseline when logged out
        prevOrdersCountRef.current = null;
      }

      setOrders(ordData);
    } catch (err) {
      console.error("Local server error:", err);
    }
  };

  // Poll server every 2 seconds
  useEffect(() => {
    fetchLocalData();
    const interval = setInterval(fetchLocalData, 2000);
    return () => clearInterval(interval);
  }, [isAdminLoggedIn]);

  // --- Secret Shortcut for Manager Login (Ctrl + Shift + A) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (!isAdminLoggedIn) setShowLoginModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminLoggedIn]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passcode === 'admin123') {
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setPasscode('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });
    setBookingSubmitted(true);
    fetchLocalData();
    setTimeout(() => {
      setBookingSubmitted(false);
      setReservation({ name: '', email: '', phone: '', date: '', time: '19:00', guests: '2' });
    }, 4000);
  };

  const handleOnlineOrder = async (item) => {
    await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: 'Online Guest',
        items: [item.name],
        total: item.price,
        type: 'Online Order',
      }),
    });
    setOrderNotification(`Order for "${item.name}" placed!`);
    fetchLocalData();
    setTimeout(() => setOrderNotification(''), 3000);
  };

  const updateReservationStatus = async (id, status) => {
    await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchLocalData();
  };

  const deleteReservation = async (id) => {
    await fetch(`${API_BASE_URL}/reservations/${id}`, { method: 'DELETE' });
    fetchLocalData();
  };

  const updateOrderStatus = async (id, status) => {
    await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchLocalData();
  };

  const deleteOrder = async (id) => {
    await fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE' });
    fetchLocalData();
  };

  const filteredMenu = activeCategory === 'All' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-black">

      {/* --- CLIENT TOAST --- */}
      {orderNotification && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-500 text-neutral-950 font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{orderNotification}</span>
        </div>
      )}

      {/* --- LOGIN MODAL --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-6">
              <Lock className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-2xl font-serif font-bold text-white">Manager Portal</h3>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input 
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode (admin123)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm"
              />
              {loginError && <p className="text-red-400 text-xs">Incorrect passcode ("admin123")</p>}
              <button type="submit" className="w-full bg-amber-500 text-neutral-950 font-bold py-3.5 rounded-xl hover:bg-amber-400">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/*                              ADMIN DASHBOARD                              */}
      {/* ========================================================================= */}
      {isAdminLoggedIn ? (
        <div className="min-h-screen pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-6 mb-8">
            <h1 className="text-3xl font-serif font-bold text-white">Manager Dashboard</h1>
            <button onClick={() => setIsAdminLoggedIn(false)} className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          {/* --- NEW ORDER ALERT MESSAGE & SOUND BANNER --- */}
          {newOrderAlert && (
            <div className="bg-amber-500 text-neutral-950 p-6 rounded-2xl mb-8 flex items-center justify-between shadow-2xl animate-pulse">
              <div className="flex items-center gap-4">
                <BellRing className="w-8 h-8 animate-bounce" />
                <div>
                  <h3 className="font-bold text-lg">New Order Received!</h3>
                  <p className="text-xs font-medium">A customer just submitted a new order. Check the Live Orders tab below.</p>
                </div>
              </div>
              <button 
                onClick={() => setNewOrderAlert(false)} 
                className="bg-neutral-950 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-900"
              >
                Dismiss Alert
              </button>
            </div>
          )}

          <div className="flex gap-4 mb-8 border-b border-neutral-800 pb-4">
            <button
              onClick={() => setAdminTab('reservations')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm ${adminTab === 'reservations' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}
            >
              Reservations ({reservations.length})
            </button>
            <button
              onClick={() => { setAdminTab('orders'); setNewOrderAlert(false); }}
              className={`px-6 py-3 rounded-xl font-semibold text-sm relative ${adminTab === 'orders' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}
            >
              Live Orders ({orders.length})
              {newOrderAlert && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
            </button>
          </div>

          {/* RESERVATIONS TAB */}
          {adminTab === 'reservations' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs border-b border-neutral-800">
                  <tr>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Guests</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {reservations.map((res) => (
                    <tr key={res.id}>
                      <td className="p-4 font-bold text-white">{res.name}</td>
                      <td className="p-4 text-xs">{res.email}</td>
                      <td className="p-4 text-xs">{res.date} at {res.time}</td>
                      <td className="p-4">{res.guests} Guests</td>
                      <td className="p-4"><span className="text-amber-400">{res.status}</span></td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => updateReservationStatus(res.id, 'Confirmed')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs">Approve</button>
                        <button onClick={() => deleteReservation(res.id)} className="p-1 text-red-400"><Trash2 className="w-4 h-4 inline"/></button>
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-neutral-500">No reservations yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ORDERS TAB */}
          {adminTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start border-b border-neutral-800 pb-3 mb-3">
                      <div>
                        <span className="text-xs text-amber-500 font-bold">{ord.id}</span>
                        <h3 className="text-white font-bold">{ord.customer}</h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">{ord.status}</span>
                    </div>
                    <ul className="text-sm text-neutral-300 list-disc list-inside mb-4">
                      {ord.items?.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
                    <span className="font-bold text-amber-500">${ord.total?.toFixed(2)}</span>
                    <button onClick={() => deleteOrder(ord.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div className="col-span-full text-center py-16 text-neutral-500 bg-neutral-900 rounded-2xl">No orders received yet.</div>}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /*                           PUBLIC WEBSITE VIEW                             */
        /* ========================================================================= */
        <div>
          <nav className="fixed top-0 left-0 right-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
              <a href="#" className="text-2xl font-serif font-bold text-amber-500">L'ÉTOILE</a>
              <a href="#reservation" className="bg-amber-500 text-neutral-950 font-semibold px-5 py-2.5 rounded-full">Book Table</a>
            </div>
          </nav>

          <section className="relative h-screen flex items-center justify-center text-center px-4 pt-20">
            <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1920" alt="Interior" className="w-full h-full object-cover filter brightness-40" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-5xl font-serif font-bold text-white mb-6">Taste the Art of <span className="text-amber-500">Fine Cuisine</span></h1>
              <a href="#menu" className="bg-amber-500 text-neutral-950 font-bold px-8 py-4 rounded-full inline-block">Explore Menu</a>
            </div>
          </section>

          <section id="menu" className="py-24 bg-neutral-900">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-4xl font-serif font-bold text-white text-center mb-12">Our Menu</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredMenu.map((item) => (
                  <div key={item.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-xl mb-4" />
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{item.name}</h3>
                        <span className="text-amber-500 font-bold">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-neutral-400 text-xs mb-6">{item.description}</p>
                    </div>
                    <button onClick={() => handleOnlineOrder(item)} className="w-full py-2.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-white rounded-lg text-sm">
                      Order Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="reservation" className="py-24 bg-neutral-950">
            <div className="max-w-3xl mx-auto px-4">
              <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl">
                <h2 className="text-3xl font-serif font-bold text-white text-center mb-8">Book A Table</h2>
                {bookingSubmitted ? (
                  <div className="bg-amber-500/10 text-amber-500 text-center py-6 font-bold rounded-xl">Reservation Received!</div>
                ) : (
                  <form onSubmit={handleReservationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" required placeholder="Name" value={reservation.name} onChange={(e) => setReservation({...reservation, name: e.target.value})} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm" />
                      <input type="email" required placeholder="Email" value={reservation.email} onChange={(e) => setReservation({...reservation, email: e.target.value})} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="date" required value={reservation.date} onChange={(e) => setReservation({...reservation, date: e.target.value})} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm" />
                      <select value={reservation.time} onChange={(e) => setReservation({...reservation, time: e.target.value})} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm">
                        <option value="17:00">5:00 PM</option><option value="18:00">6:00 PM</option><option value="19:00">7:00 PM</option>
                      </select>
                      <select value={reservation.guests} onChange={(e) => setReservation({...reservation, guests: e.target.value})} className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-white text-sm">
                        <option value="1">1 Guest</option><option value="2">2 Guests</option><option value="4">4 Guests</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 text-neutral-950 font-bold py-3.5 rounded-xl">Confirm Reservation</button>
                  </form>
                )}
              </div>
            </div>
          </section>

          <footer className="bg-neutral-950 border-t border-neutral-900 py-8 text-center text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} L'ÉTOILE Restaurant.</p>
            <button onClick={() => setShowLoginModal(true)} className="text-neutral-800 hover:text-neutral-600 underline mt-2 text-[10px]">Staff Access</button>
          </footer>
        </div>
      )}
    </div>
  );
}