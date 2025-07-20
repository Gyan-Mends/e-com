import { useState, useEffect } from "react";
import { Link, useLoaderData } from "react-router";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Badge,
  Chip,
  Checkbox,
  CheckboxGroup,
} from "@heroui/react";
import { Search, ShoppingCart, Heart, Star, Filter, X } from "lucide-react";
import {
  productsAPI,
  categoriesAPI,
  cartAPI,
  wishlistAPI,
  type Product,
  type Category,
  type APIResponse,
  formatPrice,
  getCategoryName,
  getSessionId,
} from "../utils/api";
import { successToast, errorToast } from "../components/toast";

const Home = () => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [sortBy, setSortBy] = useState("Top rated");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load products, categories, and wishlist data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load products and categories in parallel
      const [productsResponse, categoriesResponse, wishlistResponse] = await Promise.all([
        productsAPI.getBestSellers(50) as Promise<APIResponse<Product[]>>,
        categoriesAPI.getAll() as Promise<APIResponse<Category[]>>,
        wishlistAPI.getWishlist(undefined, getSessionId()).catch(() => ({ success: true, data: { items: [] } })) as Promise<any>
      ]);

      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
        
        // Extract unique brands from products
        const uniqueBrands = [...new Set(
          productsResponse.data
            .map(product => product.supplier || 'Unknown')
            .filter(brand => brand && brand !== 'Unknown')
        )];
        setBrands(uniqueBrands);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      // Load wishlist items
      if (wishlistResponse.success && wishlistResponse.data?.items) {
        const wishlistProductIds = new Set<string>(
          wishlistResponse.data.items.map((item: any) => 
            typeof item.product === 'string' ? item.product : item.product._id
          )
        );
        setWishlistItems(wishlistProductIds);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      errorToast('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selected filters
  useEffect(() => {
    if (!products.length) return;

    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== "All Items") {
      filtered = filtered.filter((product) => {
        const categoryName = typeof product.categoryId === 'object' 
          ? product.categoryId.name 
          : getCategoryName(product.categoryId, categories);
        return categoryName === selectedCategory;
      });
    }

    // Filter by brand (using supplier field)
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) =>
        selectedBrands.some((brand) =>
          (product.supplier || '').toLowerCase().includes(brand.toLowerCase())
        )
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Filter out products with zero stock quantity
    filtered = filtered.filter((product) => product.stockQuantity > 0);

    // Sort products
    if (sortBy === "Top rated") {
      // Sort by stock quantity as a proxy for popularity
      filtered = filtered.sort((a, b) => b.stockQuantity - a.stockQuantity);
    } else if (sortBy === "Price: Low to High") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(filtered);
  }, [products, categories, selectedCategory, selectedBrands, priceRange, sortBy]);

    // Add to cart function
  const handleAddToCart = async (product: Product) => {
    setIsAddingToCart(product._id);
    try {
      const sessionId = getSessionId();
      const response = await cartAPI.addToCart(undefined, sessionId, product._id, 1) as any;
      
      if (response.success) {
        successToast(`${product.name} added to cart!`);
      } else {
        errorToast(response.message || "Error adding to cart");
      }
    } catch (error: any) {
      console.error('Cart error:', error);
      errorToast(error.message || "Error adding to cart");
    } finally {
      setIsAddingToCart(null);
    }
  };

    // Toggle wishlist
  const handleToggleWishlist = async (productId: string) => {
    try {
      const sessionId = getSessionId();
      const response = await wishlistAPI.toggleWishlistItem(undefined, sessionId, productId) as any;
      
      if (response.success) {
        const newWishlistItems = new Set(wishlistItems);
        if (wishlistItems.has(productId)) {
          newWishlistItems.delete(productId);
          successToast("Removed from wishlist");
        } else {
          newWishlistItems.add(productId);
          successToast("Added to wishlist");
        }
        setWishlistItems(newWishlistItems);
      } else {
        errorToast(response.message || "Error updating wishlist");
      }
    } catch (error: any) {
      console.error('Wishlist error:', error);
      errorToast(error.message || "Error updating wishlist");
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  // Get category names for display
  const getCategoryDisplayNames = () => {
    const categoryNames = categories.map(cat => cat.name);
    return ["All Items", ...categoryNames];
  };

  // Render star rating (using stock quantity as proxy for rating)
  const renderStars = (stockQuantity: number) => {
    // Convert stock quantity to a 1-5 rating scale
    const rating = Math.min(5, Math.max(1, Math.ceil(stockQuantity / 20)));
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {rating}.0
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen customed-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen customed-dark-bg flex">
      {/* Sticky Sidebar */}
      <div
      style={{
        scrollBehavior: 'smooth',
        overflowY: 'scroll',
        scrollbarWidth: 'thin',
        scrollbarColor: 'transparent transparent',
        scrollbarGutter: 'stable',
      }}
        className={`w-80  border-r border-gray-200 dark:border-gray-700 flex-shrink-0  ${
          showFilters ? "block" : "hidden md:block"
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Browse Your Favourite Products By Filtering</p>
            </div>

            {/* Price Range */}
            <div>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                className="mb-4"
                onPress={() => {
                  setSelectedBrands([]);
                  setPriceRange([0, 2000]);
                  setSelectedCategory("All Items");
                }}
                startContent={<X size={16} />}
              >
                Reset filters
              </Button>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Price
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    size="sm"
                    type="number"
                    value={priceRange[0].toString()}
                    onChange={(e) =>
                      setPriceRange([
                        parseInt(e.target.value) || 0,
                        priceRange[1],
                      ])
                    }
                    className="w-24"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    size="sm"
                    type="number"
                    value={priceRange[1].toString()}
                    onChange={(e) =>
                      setPriceRange([
                        priceRange[0],
                        parseInt(e.target.value) || 2000,
                      ])
                    }
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Category
              </h4>
              <div className="flex flex-col gap-2">
                {getCategoryDisplayNames().map((category) => (
                  <Checkbox
                    key={category}
                    isSelected={selectedCategory === category}
                    onChange={(isSelected) => {
                      if (isSelected) {
                        setSelectedCategory(category);
                      }
                    }}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {category}
                    </span>
                  </Checkbox>
                ))}
              </div>
            </div>

            {/* Brand Filters */}
            {brands.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Brands
                </h4>
                <div className="flex flex-col gap-2">
                  {brands.slice(0, 10).map((brand) => (
                    <Checkbox
                      key={brand}
                      isSelected={selectedBrands.includes(brand)}
                      onChange={(isSelected) => {
                        if (isSelected) {
                          setSelectedBrands([...selectedBrands, brand]);
                        } else {
                          setSelectedBrands(selectedBrands.filter(b => b !== brand));
                        }
                      }}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {brand}
                      </span>
                    </Checkbox>
                  ))}
                </div>
              </div>
            )}

            {/* Sort by */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Sort by
              </h4>
              <div className="flex flex-col gap-2">
                <Checkbox
                  isSelected={sortBy === "Price: Low to High"}
                  onChange={(isSelected) => {
                    if (isSelected) setSortBy("Price: Low to High");
                  }}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Price: Low to High
                  </span>
                </Checkbox>
                <Checkbox
                  isSelected={sortBy === "Price: High to Low"}
                  onChange={(isSelected) => {
                    if (isSelected) setSortBy("Price: High to Low");
                  }}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Price: High to Low
                  </span>
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Products Area */}
      <div style={{
      scrollBehavior: 'smooth',
      overflowY: 'scroll',
      scrollbarWidth: 'thin',
      scrollbarColor: 'transparent transparent',
      scrollbarGutter: 'stable',
    }} className="flex-1 overflow-hidden flex flex-col">
        {/* Sticky Categories Header */}
        <div className="sticky top-0 z-10   border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex gap-2 flex-wrap">
            {getCategoryDisplayNames().map((category) => (
              <Button 
                className="rounded-full" 
                key={category} 
                size="sm" 
                variant={selectedCategory === category ? "solid" : "ghost"}
                color={selectedCategory === category ? "primary" : "default"}
                onPress={() => handleCategorySelect(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Scrollable Products Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <ShoppingCart size={64} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  No products found
                </h3>
                <p>Try adjusting your filters or search criteria</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                  <div key={product._id} className="cursor-pointer group">
                    {/* Product Image */}
                    <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-[#18181c] aspect-square group-hover:shadow-lg transition-shadow duration-200">
                      <Link to={`/products/${product._id}`} className="block w-full h-full">
                        {/* Product image */}
                        <img
                          src={product.images && product.images.length > 0 
                            ? product.images[0] 
                            : `https://demo.phlox.pro/shop-digital/wp-content/uploads/sites/127/2019/09/Laptop.png`}
                          alt={product.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(product._id);
                        }}
                        className="absolute top-3 right-3 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={isAddingToCart === product._id}
                      >
                        <Heart
                          size={18}
                          className={`${
                            wishlistItems.has(product._id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400 hover:text-red-500"
                          } transition-colors duration-200`}
                        />
                      </button>
                      
                      {/* Stock status badge */}
                      {product.stockQuantity <= 0 && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge color="danger" variant="solid">Out of Stock</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-2">
                      <Link to={`/products/${product._id}`} className="block group-hover:text-blue-600 transition-colors duration-200">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.supplier || 'No Brand'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${formatPrice(product.price)}
                          </p>
                          {renderStars(product.stockQuantity)}
                        </div>
                      </Link>
                      
                      {/* Add to cart button */}
                      <Button
                        size="sm"
                        color="primary"
                        variant="solid"
                        className="w-full"
                        onPress={() => handleAddToCart(product)}
                        isLoading={isAddingToCart === product._id}
                        isDisabled={product.stockQuantity <= 0 || isAddingToCart === product._id}
                        startContent={!isAddingToCart && <ShoppingCart size={16} />}
                      >
                        {isAddingToCart === product._id 
                          ? "Adding..." 
                          : product.stockQuantity <= 0 
                            ? "Out of Stock" 
                            : "Add to Cart"
                        }
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
