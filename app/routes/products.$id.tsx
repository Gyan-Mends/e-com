import { useState, useEffect } from "react";
import { useLoaderData, Link, useParams } from "react-router";
import {
  Button,
  Card,
  CardBody,
  Input,
  Badge,
  Divider,
  Chip,
  Tabs,
  Tab,
  Breadcrumbs,
  BreadcrumbItem,
} from "@heroui/react";
import {
  ShoppingCart,
  Heart,
  Star,
  ArrowLeft,
  Share2,
  Minus,
  Plus,
  Package,
  Shield,
  Truck,
  RotateCcw,
} from "lucide-react";
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

// Loader function to fetch product and related data
export async function loader({ params }: { params: { id: string } }) {
  try {
    const [productResponse, categoriesResponse] = await Promise.all([
      productsAPI.getById(params.id) as Promise<APIResponse<Product>>,
      categoriesAPI.getAll() as Promise<APIResponse<Category[]>>,
    ]);

    // Get related products from same category
    let relatedProducts: APIResponse<Product[]> = { success: false, data: [] };
    if (productResponse.success && productResponse.data) {
      try {
        relatedProducts = (await productsAPI.getAll({
          category: productResponse.data.categoryId.toString(),
          limit: 4,
        })) as APIResponse<Product[]>;

        // Remove current product from related products
        if (relatedProducts.success) {
          relatedProducts.data = relatedProducts.data.filter(
            (p) => p._id !== params.id
          );
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    }

    return {
      product: productResponse as APIResponse<Product>,
      categories: categoriesResponse as APIResponse<Category[]>,
      relatedProducts,
    };
  } catch (error) {
    console.error("Error loading product:", error);
    return {
      product: { success: false, data: null, message: "Product not found" },
      categories: { success: false, data: [] },
      relatedProducts: { success: false, data: [] },
    };
  }
}

const ProductDetailPage = () => {
  const { product, categories, relatedProducts } = useLoaderData() as {
    product: APIResponse<Product>;
    categories: APIResponse<Category[]>;
    relatedProducts: APIResponse<Product[]>;
  };

  // Helper function to calculate rating based on stock quantity
  const calculateRating = (stockQuantity: number) => {
    return Math.min(5, Math.max(1, Math.ceil(stockQuantity / 20)));
  };

  // Helper function to generate review count based on stock and rating
  const getReviewCount = (stockQuantity: number, rating: number) => {
    return Math.floor(stockQuantity * rating * 3.5); // Generate realistic review count
  };

  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [inWishlist, setInWishlist] = useState(false);
  const [selectedTab, setSelectedTab] = useState("description");

  const categoryList = categories.success ? categories.data : [];
  const productData = product.success ? product.data : null;
  const relatedProductsList = relatedProducts.success
    ? relatedProducts.data.filter(product => product.stockQuantity > 0)
    : [];

  // Add to cart functionality
  const handleAddToCart = async () => {
    if (!productData) return;

    setIsAddingToCart(true);
    try {
      const sessionId = getSessionId();
      const response = (await cartAPI.addToCart(
        undefined,
        sessionId,
        productData._id,
        quantity
      )) as any;

      if (response && response.success) {
        setMessage(
          `${quantity} ${productData.name}${
            quantity > 1 ? "s" : ""
          } added to cart!`
        );
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to add to cart");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setMessage("Error adding to cart");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Wishlist functionality
  const handleToggleWishlist = async () => {
    if (!productData) return;

    setIsTogglingWishlist(true);
    try {
      const sessionId = getSessionId();
      const response = (await wishlistAPI.toggleWishlistItem(
        undefined,
        sessionId,
        productData._id
      )) as any;

      if (response && response.success) {
        setInWishlist(response.data.inWishlist);
        setMessage(
          response.data.inWishlist
            ? `${productData.name} added to wishlist!`
            : `${productData.name} removed from wishlist!`
        );
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to update wishlist");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      setMessage("Error updating wishlist");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Generate product illustration based on category/name
  const getProductIllustration = (
    product: Product,
    size: "sm" | "lg" = "lg"
  ) => {
    const categoryName = getCategoryName(
      product.categoryId,
      categoryList
    ).toLowerCase();
    const productName = product.name.toLowerCase();

    const dimensions = size === "lg" ? "w-96 h-96" : "w-24 h-24";
    const innerSize = size === "lg" ? "w-80 h-80" : "w-20 h-20";

    if (
      categoryName.includes("audio") ||
      productName.includes("headphone") ||
      productName.includes("earphone")
    ) {
      return (
        <div className={`${dimensions} mx-auto mb-4 relative`}>
          <div
            className={`${innerSize} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full relative`}
          >
            <div className="absolute inset-4 bg-gray-800 rounded-full"></div>
            <div className="absolute top-4 left-4 w-8 h-8 bg-blue-400 rounded-full"></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-purple-400 rounded-full"></div>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-12 bg-gray-600 rounded"></div>
        </div>
      );
    } else if (
      categoryName.includes("computer") ||
      productName.includes("laptop")
    ) {
      return (
        <div
          className={`${dimensions} mx-auto mb-4 relative flex items-center justify-center`}
        >
          <div
            className={`${
              size === "lg" ? "w-80 h-48" : "w-20 h-12"
            } bg-gray-300 rounded-t-lg border-4 border-gray-400`}
          >
            <div
              className={`w-full ${
                size === "lg" ? "h-40" : "h-8"
              } bg-gradient-to-br from-blue-400 to-green-400 rounded-t-md m-2`}
            ></div>
          </div>
          <div
            className={`absolute ${
              size === "lg" ? "-bottom-4 w-96 h-4" : "-bottom-1 w-24 h-2"
            } bg-gray-400 rounded-b-3xl`}
          ></div>
        </div>
      );
    } else if (
      categoryName.includes("phone") ||
      productName.includes("mobile")
    ) {
      return (
        <div
          className={`${dimensions} mx-auto mb-4 relative flex items-center justify-center`}
        >
          <div
            className={`${
              size === "lg" ? "w-48 h-80" : "w-12 h-20"
            } bg-gray-800 rounded-3xl border-4 border-gray-600`}
          >
            <div
              className={`${
                size === "lg" ? "w-40 h-64" : "w-8 h-14"
              } bg-gradient-to-b from-blue-400 to-green-400 rounded-2xl m-2 mt-4`}
            ></div>
            <div
              className={`${
                size === "lg" ? "w-16 h-2" : "w-4 h-1"
              } bg-gray-600 rounded-full mx-auto mt-2`}
            ></div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          className={`${dimensions} mx-auto mb-4 relative flex items-center justify-center`}
        >
          <div
            className={`${
              size === "lg" ? "w-64 h-64" : "w-16 h-16"
            } bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center`}
          >
            <div
              className={`${
                size === "lg" ? "w-32 h-32" : "w-8 h-8"
              } bg-white rounded-lg`}
            ></div>
          </div>
        </div>
      );
    }
  };

  if (!product.success || !productData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/products">
            <Button color="primary">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen customed-dark-bg">
      {/* Product Details */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <Card className="p-8 bg-white shadow-sm dark:bg-[#18181c]">
              <CardBody className="p-0 ">
                <img
                  src={
                    productData.images && productData.images.length > 0
                      ? productData.images[0]
                      : `https://demo.phlox.pro/shop-digital/wp-content/uploads/sites/127/2019/09/Laptop.png`
                  }
                  alt={productData.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
                {/* Stock Status Badge */}
                {productData.stockQuantity === 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge color="danger" variant="solid">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {productData.name}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {getCategoryName(productData.categoryId, categoryList)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  SKU: {productData.sku}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => {
                    const rating = calculateRating(productData.stockQuantity);
                    return (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"
                        }
                      />
                    );
                  })}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({calculateRating(productData.stockQuantity)}.0) • {getReviewCount(productData.stockQuantity, calculateRating(productData.stockQuantity))} reviews
                </span>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">
                  {formatPrice(productData.price)}
                </div>
                {productData.costPrice && (
                  <div className="text-sm text-gray-500">
                    Cost: {formatPrice(productData.costPrice)}
                  </div>
                )}
              </div>

              {/* Stock Info */}
              <div>
                {productData.stockQuantity > 0 ? (
                  <Chip color="success" variant="flat">
                    ✓ In Stock ({productData.stockQuantity} available)
                  </Chip>
                ) : (
                  <Chip color="danger" variant="flat">
                    ✗ Out of Stock
                  </Chip>
                )}
              </div>

              {/* Quantity Selector */}
              {productData.stockQuantity > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </Button>
                    <Input
                      type="number"
                      value={quantity.toString()}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(
                              productData.stockQuantity,
                              parseInt(e.target.value) || 1
                            )
                          )
                        )
                      }
                      className="w-20 text-center"
                      min="1"
                      max={productData.stockQuantity.toString()}
                    />
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      onPress={() =>
                        setQuantity(
                          Math.min(productData.stockQuantity, quantity + 1)
                        )
                      }
                      disabled={quantity >= productData.stockQuantity}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  color="primary"
                  size="lg"
                  onPress={handleAddToCart}
                  isLoading={isAddingToCart}
                  disabled={productData.stockQuantity === 0}
                  startContent={<ShoppingCart size={20} />}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <Button
                  variant="flat"
                  size="lg"
                  onPress={handleToggleWishlist}
                  isLoading={isTogglingWishlist}
                  isIconOnly
                  className={inWishlist ? "text-red-500" : ""}
                >
                  <Heart
                    size={20}
                    className={inWishlist ? "fill-current" : ""}
                  />
                </Button>
                <Button variant="flat" size="lg" isIconOnly>
                  <Share2 size={20} />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Truck size={16} />
                  <span>Free shipping over $50</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield size={16} />
                  <span>1 year warranty</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <RotateCcw size={16} />
                  <span>30-day returns</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Package size={16} />
                  <span>Secure packaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            className="w-full"
          >
            <Tab key="description" title="Description">
              <Card>
                <CardBody className="p-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h3 className="text-xl font-semibold mb-4">
                      Product Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {productData.description ||
                        "This is a high-quality product designed to meet your needs. It features excellent build quality, modern design, and reliable performance. Perfect for both personal and professional use."}
                    </p>

                    <h4 className="text-lg font-semibold mt-6 mb-3">
                      Key Features
                    </h4>
                    <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                      <li>High-quality construction and materials</li>
                      <li>Modern and elegant design</li>
                      <li>Easy to use and maintain</li>
                      <li>Reliable performance and durability</li>
                      <li>Excellent value for money</li>
                    </ul>
                  </div>
                </CardBody>
              </Card>
            </Tab>

            <Tab key="specifications" title="Specifications">
              <Card>
                <CardBody className="p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium">SKU</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {productData.sku}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium">Category</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {getCategoryName(
                            productData.categoryId,
                            categoryList
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium">Unit of Measure</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {productData.unitOfMeasure}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium">Taxable</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {productData.taxable
                            ? `Yes (${productData.taxRate}%)`
                            : "No"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {productData.barcode && (
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium">Barcode</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {productData.barcode}
                          </span>
                        </div>
                      )}
                      {productData.supplier && (
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium">Supplier</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {productData.supplier}
                          </span>
                        </div>
                      )}
                      {productData.location && (
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="font-medium">Location</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {productData.location}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium">Stock Level</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {productData.stockQuantity} /{" "}
                          {productData.maxStockLevel || "N/A"} max
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Tab>

            <Tab key="reviews" title={`Reviews (${getReviewCount(productData.stockQuantity, calculateRating(productData.stockQuantity))})`}>
              <Card>
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">
                      Customer Reviews
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => {
                          const rating = calculateRating(productData.stockQuantity);
                          return (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"
                              }
                            />
                          );
                        })}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {calculateRating(productData.stockQuantity)}.0 out of 5
                      </span>
                    </div>
                  </div>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">Reviews feature coming soon!</p>
                    <p className="text-sm">
                      {getReviewCount(productData.stockQuantity, calculateRating(productData.stockQuantity))} customer reviews will be displayed here.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProductsList.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Related Products
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProductsList.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/products/${relatedProduct._id}`}
                >
                  <Card className="group hover:shadow-lg transition-shadow duration-300">
                    <CardBody className="p-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                        {getProductIllustration(relatedProduct, "sm")}
                      </div>

                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {relatedProduct.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {getCategoryName(
                          relatedProduct.categoryId,
                          categoryList
                        )}
                      </p>
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(relatedProduct.price)}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
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

export default ProductDetailPage;
