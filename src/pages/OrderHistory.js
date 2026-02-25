import { message, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { db } from "../firebase/setup";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import {
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FireOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setPageLoading } from "../actions/storeActions";
import AppLayout from "./AppLayout";

const ORDERS_PER_PAGE = 5;

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [cursors, setCursors] = useState({}); // Store last doc cursor for each page
  const [pageData, setPageData] = useState({}); // Cache fetched page data
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { storeId } = useParams();
  const storeDetails = useSelector((state) => state.storeReducer.store);

  const user = JSON.parse(localStorage.getItem("user"));

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);

  // Fetch total count of orders
  const fetchTotalCount = async () => {
    if (!user) return 0;

    try {
      const ordersRef = collection(db, "orders");
      const countQuery = query(
        ordersRef,
        where("customer.uid", "==", user.uid),
        where("storeId", "==", storeId)
      );
      const snapshot = await getCountFromServer(countQuery);
      return snapshot.data().count;
    } catch (error) {
      console.error("Error fetching count:", error);
      return 0;
    }
  };

  // Fetch orders for a specific page
  const fetchOrdersForPage = async (page) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if we have cached data for this page
    if (pageData[page]) {
      setOrders(pageData[page]);
      return;
    }

    setLoading(true);

    try {
      const ordersRef = collection(db, "orders");
      let q;

      if (page === 1) {
        // First page - no cursor needed
        q = query(
          ordersRef,
          where("customer.uid", "==", user.uid),
          where("storeId", "==", storeId),
          orderBy("timeStamp", "desc"),
          limit(ORDERS_PER_PAGE)
        );
      } else {
        // Use cursor from previous page
        const cursor = cursors[page - 1];
        if (!cursor) {
          console.error("No cursor found for page", page);
          setLoading(false);
          return;
        }
        q = query(
          ordersRef,
          where("customer.uid", "==", user.uid),
          where("storeId", "==", storeId),
          orderBy("timeStamp", "desc"),
          startAfter(cursor),
          limit(ORDERS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const ordersData = [];

      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });

      // Store the last document as cursor for next page
      if (querySnapshot.docs.length > 0) {
        setCursors(prev => ({
          ...prev,
          [page]: querySnapshot.docs[querySnapshot.docs.length - 1]
        }));
      }

      // Cache the page data
      setPageData(prev => ({
        ...prev,
        [page]: ordersData
      }));

      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initializeOrders = async () => {
      const count = await fetchTotalCount();
      setTotalOrders(count);
      if (count > 0) {
        await fetchOrdersForPage(1);
      } else {
        setLoading(false);
      }
      // Hide global loader
      dispatch(setPageLoading({ payload: false }));
    };

    initializeOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Handle page changes
  const handleNextPage = async () => {
    if (currentPage < totalPages && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchOrdersForPage(nextPage);
    }
  };

  const handlePrevPage = async () => {
    if (currentPage > 1 && !loading) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      await fetchOrdersForPage(prevPage);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "new":
        return <ClockCircleOutlined />;
      case "accept":
      case "accepted":
        return <LikeOutlined />;
      case "preparing":
        return <FireOutlined />;
      case "complete":
      case "completed":
        return <CheckCircleOutlined />;
      case "cancle":
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "#F59E0B"; // Amber/Yellow
      case "accept":
      case "accepted":
        return "#8B5CF6"; // Purple
      case "preparing":
        return "#F97316"; // Orange
      case "complete":
      case "completed":
        return "#22C55E"; // Green
      case "cancle":
        return "#EF4444"; // Red
      default:
        return "#9CA3AF"; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "new":
        return "Pending";
      case "accept":
      case "accepted":
        return "Accepted";
      case "preparing":
        return "Preparing";
      case "complete":
      case "completed":
        return "Complete";
      case "cancle":
        return "Cancelled";
      default:
        return status;
    }
  };

  const styles = {
    container: {
      backgroundColor: "#1E2433",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "20px 16px",
      borderBottom: "1px solid #2B3041",
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "white",
      fontSize: "18px",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: "white",
      fontSize: "18px",
      fontWeight: "600",
      margin: 0,
    },
    content: {
      flex: 1,
      padding: "16px",
      overflowY: "auto",
    },
    orderCard: {
      backgroundColor: "#2B3041",
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "16px",
    },
    orderHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
      paddingBottom: "12px",
      borderBottom: "1px solid #3B4256",
    },
    orderDate: {
      color: "#9CA3AF",
      fontSize: "13px",
    },
    orderId: {
      color: "#6B7280",
      fontSize: "11px",
      marginTop: "4px",
      fontFamily: "monospace",
    },
    orderStatus: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "500",
      textTransform: "capitalize",
    },
    orderItems: {
      marginBottom: "12px",
    },
    orderItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
    },
    itemLeft: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    itemQty: {
      backgroundColor: "#3B4256",
      color: "white",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
    },
    itemName: {
      color: "white",
      fontSize: "14px",
    },
    itemPrice: {
      color: "#9CA3AF",
      fontSize: "14px",
    },
    orderFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: "12px",
      borderTop: "1px solid #3B4256",
    },
    tableInfo: {
      color: "#9CA3AF",
      fontSize: "13px",
    },
    orderTotal: {
      color: "#F59E0B",
      fontSize: "18px",
      fontWeight: "700",
    },
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      color: "#9CA3AF",
      textAlign: "center",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "16px",
      opacity: 0.5,
    },
    emptyText: {
      fontSize: "16px",
      marginBottom: "8px",
    },
    emptySubtext: {
      fontSize: "14px",
      opacity: 0.7,
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px",
    },
    loginPrompt: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      color: "#9CA3AF",
      textAlign: "center",
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      padding: "20px 0",
      marginTop: "8px",
    },
    pageBtn: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#2B3041",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
    },
    pageBtnDisabled: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#2B3041",
      color: "#4B5563",
      fontSize: "16px",
      cursor: "not-allowed",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.5,
    },
    pageInfo: {
      color: "#9CA3AF",
      fontSize: "14px",
      minWidth: "100px",
      textAlign: "center",
    },
  };

  return (
    <AppLayout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <LeftOutlined />
          </button>
          <h1 style={styles.headerTitle}>Order History</h1>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : !user ? (
            <div style={styles.loginPrompt}>
              <ClockCircleOutlined style={styles.emptyIcon} />
              <div style={styles.emptyText}>Please login to view your orders</div>
              <div style={styles.emptySubtext}>
                Sign in with Google to see your order history
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div style={styles.emptyState}>
              <ClockCircleOutlined style={styles.emptyIcon} />
              <div style={styles.emptyText}>No orders yet</div>
              <div style={styles.emptySubtext}>
                Your order history will appear here
              </div>
            </div>
          ) : (
            <>
              {orders.map((order) => {
                const orderTotal = order.order.reduce(
                  (acc, item) => acc + parseFloat(item.price) * item.quantity,
                  0
                );

                return (
                  <div style={styles.orderCard} key={order.id}>
                    {/* Order Header */}
                    <div style={styles.orderHeader}>
                      <div>
                        <span style={styles.orderDate}>
                          {formatDate(order.timeStamp)}
                        </span>
                        <div style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</div>
                        {order.lastUpdated && (
                          <div style={{
                            fontSize: "11px",
                            color: "#8B5CF6",
                            marginTop: "4px",
                          }}>
                            + Items added at {new Date(order.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          ...styles.orderStatus,
                          color: getStatusColor(order.orderStatus),
                        }}
                      >
                        {getStatusIcon(order.orderStatus)}
                        {getStatusText(order.orderStatus)}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div style={styles.orderItems}>
                      {order.order.map((item, idx) => (
                        <div style={styles.orderItem} key={idx}>
                          <div style={styles.itemLeft}>
                            <span style={styles.itemQty}>{item.quantity}x</span>
                            <span style={styles.itemName}>{item.name}</span>
                          </div>
                          <span style={styles.itemPrice}>
                            {storeDetails?.currencySymbol || "₹"}{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div style={styles.orderFooter}>
                      <span style={styles.tableInfo}>Table {order.table}</span>
                      <span style={styles.orderTotal}>{storeDetails?.currencySymbol || "₹"}{orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    style={currentPage === 1 || loading ? styles.pageBtnDisabled : styles.pageBtn}
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                  >
                    <LeftOutlined />
                  </button>
                  <span style={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    style={currentPage === totalPages || loading ? styles.pageBtnDisabled : styles.pageBtn}
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || loading}
                  >
                    <RightOutlined />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderHistory;
