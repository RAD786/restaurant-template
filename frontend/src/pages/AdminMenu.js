// frontend/src/pages/AdminMenu.js
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container, Table, Button, Form, Row, Col, Alert,
  Spinner, InputGroup, Card, Badge
} from "react-bootstrap";
import client from "../api/client";
import uploadImage from "../utils/uploadImage";
import optimizeImageUrl from "../utils/optimizeImageUrl";

const AdminMenu = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    imagePublicId: "",
    category: "",
    available: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // NEW: bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Search + sort
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");

  // Hidden file input for "Replace Image"
  const hiddenFileInputRef = useRef(null);

  const resetForm = () =>
    setForm({
      name: "",
      description: "",
      price: "",
      image: "",
      imagePublicId: "",
      category: "",
      available: true,
    });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await client.get("/api/menu");
      setItems(res.data || []);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      setError("Failed to fetch menu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const { url, public_id } = await uploadImage(file); // POST -> /api/upload (auth protected)
      setForm((prev) => ({ ...prev, image: url, imagePublicId: public_id }));
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileChange(file);
    // reset the input so same file can be re-selected if needed
    e.target.value = '';
  };

  const triggerReplaceImage = () => {
    if (hiddenFileInputRef.current) hiddenFileInputRef.current.click();
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, image: "", imagePublicId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !form.category) {
      setError("Name, price, and category are required.");
      return;
    }
    try {
      setBusy(true);
      const payload = { ...form, price: Number(form.price) };
      if (editingId) {
        await client.put(`/api/menu/${editingId}`, payload);
      } else {
        await client.post("/api/menu", payload);
      }
      resetForm();
      setEditingId(null);
      await fetchItems();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save menu item.");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      image: item.image || "",
      imagePublicId: item.imagePublicId || "",
      category: item.category || "",
      available: item.available ?? true,
    });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This action cannot be undone.")) return;
    try {
      setBusy(true);
      await client.delete(`/api/menu/${id}`);
      await fetchItems();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete item.");
    } finally {
      setBusy(false);
    }
  };

  // ------- Bulk select & delete -------
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(items.map((i) => i._id));
      setSelectAll(true);
    }
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setSelectAll(items.length > 0 && selectedIds.length === items.length);
  }, [items, selectedIds]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} item(s)? This cannot be undone.`)) return;
    try {
      setBusy(true);
      await client.post('/api/menu/bulk-delete', { ids: selectedIds });
      await fetchItems();
    } catch (err) {
      setError(err?.response?.data?.message || "Bulk delete failed.");
    } finally {
      setBusy(false);
    }
  };

  // ------- Search + Sort -------
  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    let list = items.filter((it) => {
      if (!q) return true;
      const name = (it.name || "").toLowerCase();
      const category = (it.category || "").toLowerCase();
      const desc = (it.description || "").toLowerCase();
      return name.includes(q) || category.includes(q) || desc.includes(q);
    });

    const by = (key, dir = 1) => (a, b) => {
      const va = a[key] ?? "";
      const vb = b[key] ?? "";
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    };

    switch (sortOption) {
      case "nameAsc": list.sort(by("name", 1)); break;
      case "nameDesc": list.sort(by("name", -1)); break;
      case "priceAsc": list.sort(by("price", 1)); break;
      case "priceDesc": list.sort(by("price", -1)); break;
      case "categoryAsc": list.sort(by("category", 1)); break;
      case "categoryDesc": list.sort(by("category", -1)); break;
      case "availableDesc": list.sort((a, b) => (a.available === b.available ? 0 : b.available ? 1 : -1)); break;
      case "availableAsc": list.sort((a, b) => (a.available === b.available ? 0 : a.available ? 1 : -1)); break;
      default: break;
    }

    return list;
  }, [items, searchTerm, sortOption]);

  return (
    <Container className="py-5">
      <h2 className="mb-3 text-center">Admin Menu Dashboard</h2>

      {/* Top controls */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>Search</InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, category, or description…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>Clear</Button>
                )}
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="">Sort by…</option>
                <option value="nameAsc">Name (A–Z)</option>
                <option value="nameDesc">Name (Z–A)</option>
                <option value="priceAsc">Price (Low → High)</option>
                <option value="priceDesc">Price (High → Low)</option>
                <option value="categoryAsc">Category (A–Z)</option>
                <option value="categoryDesc">Category (Z–A)</option>
                <option value="availableDesc">Available (Yes → No)</option>
                <option value="availableAsc">Available (No → Yes)</option>
              </Form.Select>
            </Col>
          </Row>
          <div className="mt-3 d-flex align-items-center gap-2">
            <Badge bg="secondary">Total: {items.length}</Badge>
            <Badge bg="primary">Showing: {filteredAndSorted.length}</Badge>
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-auto"
              disabled={selectedIds.length === 0 || busy}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Create / Edit form */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>{editingId ? "Edit Item" : "Add New Item"}</Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="gy-3">
              <Col md={4}>
                <Form.Label>Item Name *</Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} required />
              </Col>
              <Col md={2}>
                <Form.Label>Price *</Form.Label>
                <Form.Control name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
              </Col>
              <Col md={3}>
                <Form.Label>Category *</Form.Label>
                <Form.Control name="category" value={form.category} onChange={handleChange} required />
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="available-switch"
                  label={form.available ? "Available" : "Unavailable"}
                  name="available"
                  checked={form.available}
                  onChange={handleChange}
                />
              </Col>

              <Col md={6}>
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={2} name="description" value={form.description} onChange={handleChange} />
              </Col>

              <Col md={6}>
                <Form.Label>Image</Form.Label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => onFileInputChange(e)}
                    style={{ maxWidth: 320 }}
                  />
                  <Button variant="outline-secondary" type="button" onClick={triggerReplaceImage}>
                    Replace Image
                  </Button>
                  <Button variant="outline-warning" type="button" onClick={clearImage}>
                    Clear
                  </Button>
                  <input
                    ref={hiddenFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileInputChange(e)}
                    className="d-none"
                  />
                </div>
                {uploading && <Spinner size="sm" className="mt-2" />}
                {form.image && (
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <img
                      src={optimizeImageUrl(form.image)}
                      alt="Preview"
                      style={{ maxWidth: "100px", borderRadius: "4px" }}
                    />
                    <small className="text-success">Uploaded ✓</small>
                  </div>
                )}
              </Col>

              <Col xs={12} className="d-flex gap-2">
                <Button type="submit" variant="success" disabled={busy}>
                  {busy ? (<><Spinner size="sm" className="me-2" /> Saving…</>) : (editingId ? "Update Item" : "Add Item")}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={() => { resetForm(); setEditingId(null); }} disabled={busy}>
                    Cancel Edit
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Items table */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Table bordered hover responsive className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th style={{ width: 40 }}>
                <Form.Check type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              </th>
              <th style={{ minWidth: 220 }}>Name</th>
              <th>Description</th>
              <th style={{ minWidth: 100 }}>Price</th>
              <th style={{ minWidth: 140 }}>Category</th>
              <th style={{ minWidth: 120 }}>Available</th>
              <th style={{ minWidth: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr><td colSpan={7} className="text-center">No results.</td></tr>
            ) : (
              filteredAndSorted.map((item) => (
                <tr key={item._id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => toggleRow(item._id)}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td className="text-truncate" style={{ maxWidth: 320 }}>{item.description}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>{item.category}</td>
                  <td>{item.available ? "Yes" : "No"}</td>
                  <td>
                    <Button size="sm" variant="warning" className="me-2" onClick={() => handleEdit(item)} disabled={busy}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)} disabled={busy}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default AdminMenu;