import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button, Card, CardBody, Badge, Chip, Spinner } from "@heroui/react";
import { ShoppingCart, Heart, Star, ArrowLeft, Trash2 } from "lucide-react";
import {
  wishlistAPI,
  cartAPI,
  type Wishlist,
  type WishlistItem,
  type APIResponse,
  formatPrice,
  getSessionId,
} from "../utils/api";
import { eventBus, EVENTS } from "../utils/eventBus";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<Set<string>>(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("");

  // Load wishlist data on component mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setIsLoading(true);
        const sessionId = getSessionId();
        console.log("❤️ Loading wishlist with sessionId:", sessionId);

        const wishlistResponse = (await wishlistAPI.getWishlist(
          undefined,
          sessionId
        )) as any;
        console.log("❤️ Wishlist API response:", wishlistResponse);

        if (
          wishlistResponse &&
          wishlistResponse.success &&
          wishlistResponse.data
        ) {
          const wishlist = wishlistResponse.data;

          // Transform wishlist items to match frontend expectations
          if (wishlist.items && wishlist.items.length > 0) {
            wishlist.items = wishlist.items.map((item: any) => ({
              ...item,
              product: item.productId || item.product, // Handle both structures
            }));
          }

          setWishlist(wishlist);
          console.log("❤️ Wishlist loaded successfully:", wishlist);
        } else {
          console.log("❤️ No wishlist found or empty wishlist");
          setWishlist(null);
        }
      } catch (error) {
        console.error("❌ Error loading wishlist:", error);
        setWishlist(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, []);

  // Remove from wishlist
  const removeFromWishlist = async (productId: string) => {
    setIsRemoving((prev) => new Set(prev).add(productId));
    try {
      const sessionId = getSessionId();
      const response = (await wishlistAPI.removeFromWishlist(
        undefined,
        sessionId,
        productId
      )) as any;

      if (response && response.success) {
        // Update local state
        if (wishlist) {
          const updatedItems = wishlist.items.filter(
            (item) => item.product._id !== productId
          );
                  setWishlist({
          ...wishlist,
          items: updatedItems,
          itemCount: updatedItems.length,
        });
        }
        setMessage("Item removed from wishlist");
        setTimeout(() => setMessage(""), 2000);
        
        // Emit wishlist update event
        eventBus.emit(EVENTS.WISHLIST_UPDATED, {
          itemCount: updatedItems.length
        });
      } else {
        setMessage("Failed to remove item");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setMessage("Error removing item");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsRemoving((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Add to cart from wishlist
  const addToCart = async (item: WishlistItem) => {
    setIsAddingToCart((prev) => new Set(prev).add(item.product._id));
    try {
      const sessionId = getSessionId();
      const response = (await cartAPI.addToCart(
        undefined,
        sessionId,
        item.product._id,
        1
      )) as any;

      if (response && response.success) {
        setMessage(`${item.product.name} added to cart!`);
        setTimeout(() => setMessage(""), 3000);
        
        // Emit cart update event
        eventBus.emit(EVENTS.CART_UPDATED, {
          totalItems: response.data?.totalItems || 0
        });
      } else {
        setMessage("Failed to add to cart");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setMessage("Error adding to cart");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsAddingToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.product._id);
        return newSet;
      });
    }
  };

  // Generate product illustration
  const getProductIllustration = (product: any) => {
    const productName = product.name.toLowerCase();

    if (productName.includes("headphone")) {
      return (
        <div className="w-20 h-20 mx-auto relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full relative">
            <div className="absolute inset-2 bg-gray-800 rounded-full"></div>
            <div className="absolute top-1 left-1 w-3 h-3 bg-blue-400 rounded-full"></div>
          </div>
        </div>
      );
    } else if (productName.includes("laptop")) {
      return (
        <div className="w-20 h-20 mx-auto relative">
          <div className="w-16 h-10 bg-gray-300 rounded-t-lg border-2 border-gray-400">
            <div className="w-full h-6 bg-gradient-to-br from-blue-400 to-green-400 rounded-t-md m-1"></div>
          </div>
          <div className="w-20 h-1 bg-gray-400 rounded-b-2xl -mt-0.5"></div>
        </div>
      );
    } else {
      return (
        <div className="w-20 h-20 mx-auto relative">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center">
            <div className="w-7 h-7 bg-white rounded-lg"></div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen customed-dark-bg">
      {/* Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Wishlist
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {wishlist?.itemCount || 0} items saved for later
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400 mt-4">
              Loading your wishlist...
            </p>
          </div>
        ) : !wishlist || !wishlist.items || wishlist.items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <Heart size={96} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Save products you love to your wishlist and never lose track of
              them!
            </p>
            <Link to="/products">
              <Button color="primary" size="lg">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist!.items.map((item) => (
              <div
                key={item._id}
                className="group hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-0">
                  {/* Product Image/Illustration */}
                  <Link to={`/products/${item.product._id}`}>
                    <div className="p-6 bg-gray-50 dark:bg-[#18181c] rounded-xl cursor-pointer  transition-colors">
                      <img
                        src={
                          item.product.images && item.product.images.length > 0
                            ? item.product.images[0]
                            : `https://demo.phlox.pro/shop-digital/wp-content/uploads/sites/127/2019/09/Laptop.png`
                        }
                        alt={item.product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />{" "}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link to={`/products/${item.product._id}`}>
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 hover:text-primary transition-colors cursor-pointer">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.product.sku}
                        </p>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => removeFromWishlist(item.product._id)}
                        isLoading={isRemoving.has(item.product._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < 4
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }
                        />
                      ))}
                      <span className="text-sm text-gray-500 ml-1">(4.0)</span>
                    </div>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(item.product.price)}
                        </span>
                      </div>
                      <div className="text-right">
                        {item.product.stockQuantity > 0 ? (
                          <Chip color="success" variant="flat" size="sm">
                            In Stock
                          </Chip>
                        ) : (
                          <Chip color="danger" variant="flat" size="sm">
                            Out of Stock
                          </Chip>
                        )}
                      </div>
                    </div>

                    {/* Added Date */}
                    <p className="text-xs text-gray-500 mb-3">
                      Added on {new Date(item.addedAt).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onPress={() => addToCart(item)}
                        isLoading={isAddingToCart.has(item.product._id)}
                        disabled={item.product.stockQuantity === 0}
                        className="flex-1"
                        color="primary"
                        startContent={<ShoppingCart size={16} />}
                      >
                        Add to Cart
                      </Button>
                      <Link to={`/products/${item.product._id}`}>
                        <Button size="sm" variant="ghost" >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  {item.product.stockQuantity === 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge color="danger" variant="solid">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
