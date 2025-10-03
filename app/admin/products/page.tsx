"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, DollarSign, Package, Scale, ImageIcon } from "lucide-react"
import ProductImageUpload from "@/components/admin/product-image-upload"

interface Product {
  id: number
  title: string
  weight: number
  selling_price: number
  regular_price: number
  cost?: number
  description: string | null
  available: boolean
  image_url?: string
}

// Helper function to calculate profit
const calculateProfit = (sellingPrice: number, cost?: number) => {
  if (!cost || cost === 0) return null
  const profit = sellingPrice - cost
  const profitMargin = (profit / sellingPrice) * 100
  return { profit, profitMargin }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    weight: "",
    selling_price: "",
    regular_price: "",
    cost: "",
    description: "",
    available: true,
  })

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/products")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setProducts(data.products || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  // Load products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Handle edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      weight: product.weight.toString(),
      selling_price: product.selling_price.toString(),
      regular_price: product.regular_price.toString(),
      cost: product.cost?.toString() || "",
      description: product.description || "",
      available: product.available,
    })
    setShowForm(true)
  }

  // Handle delete product
  const handleDelete = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete product")
      }

      const result = await response.json()

      if (result.success) {
        await fetchProducts() // Refresh the list
        setDeleteConfirm(null)
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      setError(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save product")
      }

      const result = await response.json()

      if (result.success) {
        // Reset form and refresh products
        setFormData({
          title: "",
          weight: "",
          selling_price: "",
          regular_price: "",
          cost: "",
          description: "",
          available: true,
        })
        setShowForm(false)
        setEditingProduct(null)
        await fetchProducts()
      }
    } catch (err) {
      console.error("Error saving product:", err)
      setError(err instanceof Error ? err.message : "Failed to save product")
    }
  }

  // Handle image upload
  const handleImageUploaded = async (imageUrl: string) => {
    console.log("Image uploaded:", imageUrl)
    // Refresh products to show the new image
    await fetchProducts()
  }

  // Calculate savings for individual product
  const calculateSavings = (selling: number, regular: number) => {
    if (!selling || !regular || regular <= 0) {
      return { amount: 0, percentage: 0 }
    }

    const savings = regular - selling
    const percentage = (savings / regular) * 100

    return {
      amount: Math.max(0, savings),
      percentage: Math.max(0, Math.round(percentage)),
    }
  }

  // Calculate average savings across all products
  const calculateAverageSavings = () => {
    if (products.length === 0) {
      return 0
    }

    const validProducts = products.filter((p) => {
      return p.selling_price > 0 && p.regular_price > 0 && p.regular_price > p.selling_price
    })

    if (validProducts.length === 0) {
      return 0
    }

    let totalSavingsPercentage = 0

    for (const product of validProducts) {
      const savings = calculateSavings(product.selling_price, product.regular_price)
      totalSavingsPercentage += savings.percentage
    }

    return Math.round(totalSavingsPercentage / validProducts.length)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading products...</div>
        </div>
      </div>
    )
  }

  const averageSavings = calculateAverageSavings()
  const availableProducts = products.filter((p) => p.available)
  const minWeight = products.length > 0 ? Math.min(...products.map((p) => p.weight)) : 0
  const maxWeight = products.length > 0 ? Math.max(...products.map((p) => p.weight)) : 0

  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <div className="px-4 py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4"
                style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
              >
                PRODUCTS MANAGEMENT
              </h1>
              <p className="text-base md:text-xl" style={{ color: "#1a1a1a" }}>
                Manage your Hi-Temp bumper plate inventory
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="font-black w-full md:w-auto"
              style={{ backgroundColor: "#B9FF16", color: "#000", fontFamily: "Oswald, sans-serif" }}
            >
              <Plus className="h-4 w-4 mr-2" />
              ADD PRODUCT
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
            <Button variant="outline" size="sm" onClick={fetchProducts} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    TOTAL PRODUCTS
                  </h3>
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {products.length}
                </div>
                <p className="text-xs text-gray-600">All products</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    AVAILABLE
                  </h3>
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {availableProducts.length}
                </div>
                <p className="text-xs text-gray-600">In stock</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    AVG. SAVINGS
                  </h3>
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {averageSavings}%
                </div>
                <p className="text-xs text-gray-600">Off regular price</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black" style={{ fontFamily: "Oswald, sans-serif" }}>
                    WEIGHT RANGE
                  </h3>
                  <Scale className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "Oswald, sans-serif" }}>
                  {products.length > 0 ? `${minWeight}-${maxWeight}` : "0"}
                </div>
                <p className="text-xs text-gray-600">lbs range</p>
              </div>
            </div>
          </div>

      {/* Add/Edit Product Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
            <CardDescription>
              {editingProduct ? "Update product information" : "Add a new Hi-Temp bumper plate to your inventory"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Product Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., 25lbs (pair)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="25"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Your Price ($)</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, selling_price: e.target.value }))}
                      placeholder="85.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regular_price">Regular Price ($)</Label>
                    <Input
                      id="regular_price"
                      type="number"
                      step="0.01"
                      value={formData.regular_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, regular_price: e.target.value }))}
                      placeholder="169.99"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                      placeholder="50.00"
                    />
                    <p className="text-xs text-gray-500">Your cost per plate (admin only - not visible to customers)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Hi-Temp bumper plates - factory seconds with minor cosmetic blemishes"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, available: checked }))}
                    />
                    <Label htmlFor="available">Available for sale</Label>
                  </div>
                </div>

                {/* Right Column - Product Image */}
                <div className="space-y-4">
                  <Label>Product Image</Label>
                  {editingProduct && (
                    <ProductImageUpload
                      productId={editingProduct.id.toString()}
                      currentImageUrl={editingProduct.image_url}
                      onImageUploaded={handleImageUploaded}
                    />
                  )}
                  {!editingProduct && (
                    <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Save product first to upload image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Savings Preview */}
              {formData.selling_price && formData.regular_price && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>Customer Savings:</strong> $
                    {(Number.parseFloat(formData.regular_price) - Number.parseFloat(formData.selling_price)).toFixed(2)}{" "}
                    (
                    {(
                      ((Number.parseFloat(formData.regular_price) - Number.parseFloat(formData.selling_price)) /
                        Number.parseFloat(formData.regular_price)) *
                      100
                    ).toFixed(0)}
                    % off)
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">{editingProduct ? "Update Product" : "Add Product"}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                    setFormData({
                      title: "",
                      weight: "",
                      selling_price: "",
                      regular_price: "",
                      cost: "",
                      description: "",
                      available: true,
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Products</CardTitle>
          <CardDescription>{products.length} products in your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
              <p className="text-sm">Add your first bumper plate product to get started</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {products.map((product) => {
                  const savings = calculateSavings(product.selling_price, product.regular_price)
                  const profitInfo = calculateProfit(product.selling_price, product.cost)
                  return (
                    <div key={product.id} className="bg-white border-2 border-black rounded-lg overflow-hidden">
                      <div className="bg-black text-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>
                            {product.title}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              product.available ? "bg-green-500 text-white" : "bg-red-500 text-white"
                            }`}
                          >
                            {product.available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-3 mb-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>WEIGHT</p>
                            <p className="text-lg font-bold">{product.weight}lbs</p>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>YOUR PRICE</p>
                            <p className="text-lg font-bold text-blue-600">${product.selling_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>REGULAR PRICE</p>
                            <p className="text-sm line-through text-gray-500">${product.regular_price.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>SAVINGS</p>
                            <p className="text-sm font-medium text-green-600">${savings.amount.toFixed(2)}</p>
                            <p className="text-xs text-green-600">{savings.percentage}% off</p>
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>PROFIT</p>
                            {profitInfo ? (
                              <>
                                <p className="text-sm font-medium text-blue-600">${profitInfo.profit.toFixed(2)}</p>
                                <p className="text-xs text-blue-600">{profitInfo.profitMargin.toFixed(1)}% margin</p>
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">No cost data</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="flex-1">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {deleteConfirm === product.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(product.id)}
                                className="text-xs px-3"
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-3"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(product.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Image</th>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Weight</th>
                      <th className="text-left p-2">Your Price</th>
                      <th className="text-left p-2">Regular Price</th>
                      <th className="text-left p-2">Savings</th>
                      <th className="text-left p-2">Profit</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const savings = calculateSavings(product.selling_price, product.regular_price)
                      const profitInfo = calculateProfit(product.selling_price, product.cost)
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url || "/placeholder.svg"}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{product.title}</div>
                              {product.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">{product.weight}lbs</td>
                          <td className="p-2 font-medium">${product.selling_price.toFixed(2)}</td>
                          <td className="p-2">
                            <span className="line-through text-muted-foreground">
                              ${product.regular_price.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="text-green-600 font-medium">${savings.amount.toFixed(2)}</div>
                            <div className="text-xs text-green-600">{savings.percentage}% off</div>
                          </td>
                          <td className="p-2">
                            {profitInfo ? (
                              <>
                                <div className="text-blue-600 font-medium">${profitInfo.profit.toFixed(2)}</div>
                                <div className="text-xs text-blue-600">{profitInfo.profitMargin.toFixed(1)}% margin</div>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">No cost data</span>
                            )}
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                product.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.available ? "Available" : "Unavailable"}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              {deleteConfirm === product.id ? (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(product.id)}
                                    className="text-xs px-2"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="text-xs px-2"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(product.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
