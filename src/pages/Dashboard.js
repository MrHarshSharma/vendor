import React, { useState, useEffect } from "react";
import AppLayout from "./AppLayout";
import { Form, Input, Button, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/setup";
import { useNavigate } from "react-router-dom";
import { SketchPicker } from "react-color";

function Dashboard() {
  const { Option } = Select;
  const [, setStoreDetails] = useState({});
  let user = JSON.parse(localStorage.getItem("user"));

  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const storage = getStorage();
  const navigate = useNavigate();
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");

  const fetchConfigstore = async () => {
    try {
      if (!user) {
        throw new Error("No user UID found in localStorage");
      }

      const configRef = doc(db, "configstore", user.uid);
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        console.log("this user data", docSnap.data());
        let wholeData = docSnap.data();
        setStoreDetails(wholeData);
        setPrimaryColor(wholeData.primaryColor)
        setSecondaryColor(wholeData.secondaryColor)
        form.setFieldsValue({ restaurantName: wholeData.restaurantName });
        form.setFieldsValue({ restaurantType: wholeData.restaurantType });
        form.setFieldsValue({ primarycolor: wholeData.primaryColor });
        form.setFieldsValue({ secondarycolor: wholeData.secondaryColor });
        form.setFieldsValue({ tagline: wholeData.tagline });
        form.setFieldsValue({ subtagline: wholeData.subtagline });

      } else {
        console.log("No such document!");
        // return null;
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  useEffect(() => {
    fetchConfigstore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrimaryColorChange = (color) => {

    setPrimaryColor(color.hex);
    form.setFieldsValue({ primarycolor: color.hex });
  };

  const handleSecondaryColorChange = (color) => {
    setSecondaryColor(color.hex);
    form.setFieldsValue({ secondarycolor: color.hex });
  };
  const uploadLogoImage = async (file, uid, logoname) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `logos/${uid}/${logoname}`);
      const metadata = {
        contentType: file.type, // Set the content type from the file object
      };
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Optional: Handle progress
        },
        (error) => {
          console.error("Error uploading logo image:", error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              resolve(downloadURL);
            })
            .catch((error) => {
              console.error("Error getting download URL:", error);
              reject(error);
            });
        }
      );
    });
  };



  const handleSubmit = async (values) => {
    setLoading(true);
    let { logo, restaurantType, restaurantName, tagline, subtagline } = values;
    console.log(values);

    // Upload logo to Firebase Storage
    let logoname = logo[0].name;
    let finalLogo = logo[0];
    const logoRef = ref(storage, `logos/${user.uid}/${logoname}`);
    await uploadBytes(logoRef, finalLogo);
    // const logoURL = await getDownloadURL(logoRef);
    const logoURL = await uploadLogoImage(finalLogo, user.uid, logoname);
    // Save data in configstore collection
    const configRef = doc(db, "configstore", user.uid);
    const docSnap = await getDoc(configRef);
    let configStoreData = {
      restaurantType,
      restaurantName,
      logo: logoURL,
      primaryColor,
      secondaryColor,
      tagline,
      subtagline
    };

    if (docSnap.exists()) {
      // Update the document if it exists
      await updateDoc(configRef, configStoreData);
      message.success("store updated");

    } else {
      // Create the document with the specified field if it doesn't exist
      await setDoc(configRef, configStoreData);
      message.success("store created, please add menu");
      setTimeout(() => {
        navigate("/menu");
      }, 2000);
    }
    // await setDoc(configRef, configStoreData);
    setLoading(false);

  };

  const handleUpload = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
      setImageUrl(URL.createObjectURL(file));
    }, 0);
  };

  return (
    <AppLayout>
      <div className="app-container">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <h1 className="app-bold">Basic details</h1>
          <Form.Item
            name="restaurantName"
            label="Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="restaurantType"
            label="Type"
            rules={[
              { required: true, message: "Please select a restaurant type!" },
            ]}
          >
            <Select placeholder="Select a restaurant type">
              <Option value="cafe">Cafe</Option>
              <Option value="restaurant">Restaurant</Option>
              <Option value="hotel">Hotel</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="tagline"
            label="Tag line"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="subtagline"
            label="Sub tag line"
            rules={[{ required: false }]}
          >
            <Input />
          </Form.Item>
          <div style={{ display: "flex" }}>
            <Form.Item
              name="primarycolor"
              label="Select primary color"
              rules={[{ required: true, message: "Please pick primary color!" }]}
            >
              <Input
                // value={primaryColor}
                onClick={() => {
                  document.getElementById("primary-color-picker").style.display =
                    "block";
                }}
                style={{ backgroundColor: primaryColor }}
                readOnly
              />
            </Form.Item>
            <div
              id="primary-color-picker"
              style={{ display: "none" }}
            >
              <SketchPicker color={primaryColor} onChange={handlePrimaryColorChange} />
              <span
                style={{
                  background: "#44b96b",
                  width: "100%",
                  display: " flex",
                  alignItems: " center",
                  justifyContent: " center",
                  cursor: "pointer",
                }}
                onClick={() => {
                  document.getElementById("primary-color-picker").style.display =
                    "none";
                }}
              >
                Done
              </span>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <Form.Item
              name="secondarycolor"
              label="Select secondary color"
              rules={[{ required: true, message: "Please pick secondary color!" }]}
            >
              <Input
                // initialValue={secondaryColor}
                onClick={() => {
                  document.getElementById("secondary-color-picker").style.display =
                    "block";
                }}
                style={{ backgroundColor: secondaryColor }}
              // readOnly
              />
            </Form.Item>
            <div
              id="secondary-color-picker"
              style={{ display: "none", }}
            >
              <SketchPicker color={secondaryColor} onChange={handleSecondaryColorChange} />
              <span
                style={{
                  background: "#44b96b",
                  width: "100%",
                  display: " flex",
                  alignItems: " center",
                  justifyContent: " center",
                  cursor: "pointer",
                }}
                onClick={() => {
                  document.getElementById("secondary-color-picker").style.display =
                    "none";
                }}
              >
                Done
              </span>
            </div>
          </div>
          <Form.Item
            name="logo"
            label="Logo"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[{ required: true, message: "Please upload a logo!" }]}
          >
            <Upload
              name="logo"
              listType="picture"
              customRequest={handleUpload}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Click to upload</Button>
            </Upload>
          </Form.Item>

          {imageUrl && (
            <img src={imageUrl} alt="logo" style={{ width: "100px" }} />
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AppLayout>
  );
}

export default Dashboard;
