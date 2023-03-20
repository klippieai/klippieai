import React, { useState } from "react";
import Dropzone from "react-dropzone";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  FloatingLabel,
  Alert,
  ListGroup,
  Spinner,
} from "react-bootstrap";

function UrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [reqStatus, setReqStatus] = useState("");
  const [isVideo, setIsVideo] = useState(true);
  const [video, setVideo] = useState(null);
  const [scope, setScope] = useState(2); // default value is medium
  const [clipInfo, setClipInfo] = useState({
    titles: [],
    descriptions: [],
    tags: [],
  });

  const scopeLabels = ["Low", "Medium", "High"];

  const handleSubmit = async (event) => {
    event.preventDefault();

    var options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url, scope: scope }),
    };

    if (video) {
      var body = new FormData();
      body.append("video", video);
      body.append("scope", scope);
      options = { method: "POST", body: body };
    } else {
      if (!isValidUrl(url)) {
        setError("URLERROR");
        return;
      }
    }
    setError("");
    setReqStatus("Waiting");

    fetch(process.env.REACT_APP_API_ENDPOINT, options)
      .then((response) => response.json())
      .then((data) => {
        setIsVideo(JSON.parse(data.is_video));
        setClipInfo({
          titles: JSON.parse(data.titles),
          descriptions: JSON.parse(data.descriptions),
          tags: JSON.parse(data.tags),
        });
        setReqStatus("Received");
      })
      .catch((error) => {
        setReqStatus("Failed");
      });
  };

  const handleDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];

    if (file.type !== "audio/mpeg" && file.type !== "video/mp4") {
      setError("FILEERROR");
      return;
    }
    setVideo(file);
  };

  const handleScopeChange = (event) => {
    setScope(parseInt(event.target.value));
  };

  const fetchDownloadUrl = (title) => {
    fetch(
      `https://storage.googleapis.com/${
        process.env.REACT_APP_GCS_BUCKET
      }/${encodeURIComponent(title)}.${isVideo ? "mp4" : "mp3"}`
    )
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const isValidUrl = (url) => {
    const youtubeRegex = /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=.+/;
    const driveRegex =
      /^https?:\/\/drive\.google\.com\/file\/d\/(.+)\/view\?usp=sharing/;
    return youtubeRegex.test(url) || driveRegex.test(url);
  };

  return (
    <>
      <Container className="mt-5">
        <Row className="text-center">
          <h1>TikTok Clips Generator</h1>
        </Row>
        <Row
          className="my-5"
          style={{ borderBottom: "3px dotted #000", width: "100%" }}
        />
        <Row className="my-5">
          <Col></Col>
          <Col className="text-center">
            <Dropzone
              onDrop={handleDrop}
              accept="video/mp4, audio/mp3"
              multiple={false}
            >
              {({ getRootProps, getInputProps, isDragActive }) => (
                <div
                  {...getRootProps()}
                  style={{
                    border: "2px dashed black",
                    padding: "50px",
                    textAlign: "center",
                  }}
                >
                  <input {...getInputProps()} />
                  Drag and drop a video file here, or click to select a file
                </div>
              )}
            </Dropzone>

            {error === "FILEERROR" && (
              <Row className="text-center">
                <p className="text-danger">
                  Invalid file type. Only upload *.mp4 or *.mp3 files.
                </p>
              </Row>
            )}

            {video && (
              <Button
                variant="dark"
                type="submit"
                style={{ width: "10rem" }}
                onClick={handleSubmit}
                className="mt-3"
              >
                Generate
              </Button>
            )}
          </Col>
          <Col></Col>
        </Row>
        <Row className="text-center">
          <h3> Or </h3>
        </Row>
        <Row>
          <Form onSubmit={handleSubmit} className="mt-3">
            <div className="d-flex justify-content-center mb-4">
              <FloatingLabel
                controlId="url-input"
                label="Video URL"
                className="me-3"
                style={{ width: "60rem" }}
              >
                <Form.Control
                  type="text"
                  placeholder=""
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </FloatingLabel>

              <Button variant="dark" type="submit" style={{ width: "10rem" }}>
                Generate
              </Button>
            </div>
            {error === "URLERROR" && (
              <Row className="text-center">
                <p className="text-danger">
                  Invalid URL. Please enter a valid YouTube or Google Drive
                  link. If Google Drive link, check if it is shared publicly.
                </p>
              </Row>
            )}
          </Form>
        </Row>
        <Row className="justify-content-center text-center mb-4">
          <Alert variant={"info"} style={{ maxWidth: "70rem" }}>
            Currently only supports below formats, <br />
            YouTube URL Format: {
              "https://www.youtube.com/watch?v={VIDEO_ID}"
            }{" "}
            <br />
            Google Drive URL Format:
            {"https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing"}
          </Alert>
        </Row>
        <Row
          className="my-5"
          style={{ borderBottom: "3px dotted #000", width: "100%" }}
        />
        <Row
          className="px-5 my-3"
          // style={{ maxWidth: "10rem" }}
        >
          <Col sm={10} className="text-justify">
            <p>
              Scope value determines how AI looks at video. If set to High, AI
              will try to look at full video and generate clips from it, if set
              to Low, it's scope range will decrease, making model to look at
              small window to generate each clips. Play around with it to get
              better results. There is no single best value, may differ from
              clips to clips.
            </p>
          </Col>
          <Col sm={2}>
            <label htmlFor="scope-slider" className="form-label">
              Scope
            </label>
            <input
              type="range"
              className="form-range"
              min="1"
              max="3"
              step="1"
              id="scope-slider"
              value={scope}
              onChange={handleScopeChange}
            />
            <span>{scopeLabels[scope - 1]}</span>
          </Col>
        </Row>
        <Row className="py-5 my-5 justify-content-center">
          {reqStatus === "Waiting" && (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          )}
          {reqStatus === "Failed" && (
            <Row className="text-center">
              <p className="text-danger">
                {" "}
                Internal Server Error <br /> Check if link is correct & Refresh
                the page{" "}
              </p>
            </Row>
          )}
          {reqStatus === "Received" && (
            <ListGroup>
              {clipInfo.titles.map((title, index) => (
                <ListGroup.Item key={title}>
                  <h4>{title}</h4>
                  <p>{clipInfo.descriptions[index]}</p>
                  <div className="tags">
                    {clipInfo.tags[index].map((tag, i) => (
                      <span key={tag} className="badge bg-secondary me-1">
                        {tag.toLowerCase()}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => fetchDownloadUrl(clipInfo.titles[index])}
                    className="mt-3"
                  >
                    Download
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Row>
      </Container>
    </>
  );
}

export default UrlForm;
