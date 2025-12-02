import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Trash2, ShoppingCart, ChevronRight, Tag } from 'lucide-react';

const initialCartItems = [
  {
    id: 1,
    title: '실전! Next.js 15 완벽 마스터',
    instructor: '김개발',
    originalPrice: 129000,
    price: 89000,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    discount: 31,
  },
  {
    id: 2,
    title: 'ChatGPT API 활용 실무 프로젝트',
    instructor: '이에이아이',
    originalPrice: 150000,
    price: 120000,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
    discount: 20,
  },
  {
    id: 3,
    title: 'AWS 클라우드 실무',
    instructor: '윤클라우드',
    originalPrice: 130000,
    price: 110000,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    discount: 15,
  },
];

export function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [selectedItems, setSelectedItems] = useState<number[]>(cartItems.map(item => item.id));
  const [couponCode, setCouponCode] = useState('');

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
  };

  const removeSelectedItems = () => {
    setCartItems(cartItems.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
  const totalOriginalPrice = selectedCartItems.reduce((sum, item) => sum + item.originalPrice, 0);
  const totalPrice = selectedCartItems.reduce((sum, item) => sum + item.price, 0);
  const totalDiscount = totalOriginalPrice - totalPrice;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">장바구니</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">장바구니가 비어있습니다</h2>
            <p className="text-gray-400 mb-8">관심 있는 강의를 담아보세요!</p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-full text-white font-medium"
            >
              강의 둘러보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === cartItems.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#6778ff] focus:ring-[#6778ff]"
                  />
                  <span className="font-medium">
                    전체 선택 ({selectedItems.length}/{cartItems.length})
                  </span>
                </label>
                <button
                  onClick={removeSelectedItems}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                >
                  선택 삭제
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="glass rounded-xl p-4 flex gap-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#6778ff] focus:ring-[#6778ff] mt-1"
                    />
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">{item.instructor}</p>
                      <div className="flex items-center gap-2">
                        {item.discount > 0 && (
                          <>
                            <span className="text-[#6778ff] font-bold">{item.discount}%</span>
                            <span className="text-gray-500 line-through text-sm">
                              ₩{item.originalPrice.toLocaleString()}
                            </span>
                          </>
                        )}
                        <span className="font-bold">₩{item.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96">
              <div className="glass rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">결제 정보</h2>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    쿠폰 코드
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="쿠폰 코드 입력"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6778ff]"
                      />
                    </div>
                    <button className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                      적용
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                  <div className="flex justify-between text-gray-400">
                    <span>선택 강의 ({selectedItems.length}개)</span>
                    <span>₩{totalOriginalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6778ff]">
                    <span>할인 금액</span>
                    <span>-₩{totalDiscount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium">총 결제 금액</span>
                  <span className="text-2xl font-bold">₩{totalPrice.toLocaleString()}</span>
                </div>

                {/* Checkout Button */}
                <button
                  disabled={selectedItems.length === 0}
                  className="w-full btn-primary py-4 rounded-xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedItems.length > 0 ? `${selectedItems.length}개 강의 결제하기` : '강의를 선택해주세요'}
                </button>

                <p className="text-center text-gray-500 text-xs mt-4">
                  결제 시 이용약관 및 환불 정책에 동의하게 됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
