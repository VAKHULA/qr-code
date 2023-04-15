import Head from "next/head"
import { useEffect, useRef, useState } from "react"

async function fetchVideoStream({
  videoElement,
  videoStream
}: {
  videoElement: HTMLVideoElement,
  videoStream:  MediaStream | null
}) {
  let constraints = { video: { facingMode: "environment" } }

  if (navigator.mediaDevices !== undefined) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      videoElement.srcObject = stream
      videoStream = stream

      await videoElement.play()

    } catch (error: any) {
      console.debug(error)
      console.warn(`Failed to access the stream:${error.name}`)
    }
  } else {
    console.warn(`getUserMedia API not supported!!`)
  }
}

const decodeBarcode = async ({canvasElement}:{canvasElement:  HTMLCanvasElement}) => {
  // @ts-ignore
  if (!window.BarcodeDetector) {
    return
  }

  const formats = [
    "aztec",
    "code_128",
    "code_39",
    "code_93",
    "codabar",
    "data_matrix",
    "ean_13",
    "ean_8",
    "itf",
    "pdf417",
    "qr_code",
    "upc_a",
    "upc_e",
  ]

  // @ts-ignore
  const barcodeDetector = new window.BarcodeDetector({
    formats,
  })

  try {
    let barcodes = await barcodeDetector.detect(canvasElement)
    barcodes =  barcodes.length > 0 ? barcodes[0]["rawValue"] : undefined
    return barcodes
  } catch (e) {
    throw e
  }
}

function captureFrames({
  videoElement,
  canvasElement,
  canvasContext
}: {
  videoElement: HTMLVideoElement,
  canvasContext: CanvasRenderingContext2D,
  canvasElement:  HTMLCanvasElement
}) {
  if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
    const canvasHeight = (canvasElement.height = videoElement.videoHeight)
    const canvasWidth = (canvasElement.width = videoElement.videoWidth)
    canvasContext.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight)
    return canvasElement
  } else {
    console.log("Video feed not available yet")
  }
}

export default function Home() {
  const canvasElement = useRef<HTMLCanvasElement>(null)
  const videoElement = useRef<HTMLVideoElement>(null)
  const canvasContext = useRef<CanvasRenderingContext2D | null>(null)
  const videoStream = useRef(null)
  const timer = useRef<any>(null)
  const [barcode, setBarcode] = useState("")

  const captureAndDecode = async () => {
    if (videoElement.current && canvasElement.current && canvasContext.current) {
      const frame = await captureFrames({
        videoElement: videoElement.current,
        canvasElement: canvasElement.current,
        canvasContext: canvasContext.current,
      }) as HTMLCanvasElement

      const barcodes = await decodeBarcode({ canvasElement: frame })

      if (barcodes) {
        setBarcode(barcodes)
      } else {
        timer.current && clearTimeout(timer.current)
        timer.current = setTimeout(captureAndDecode, 1000)
      }
    }
  }

  const init = async () => {
    if (videoElement.current && canvasElement.current) {
      canvasContext.current = canvasElement.current.getContext("2d")

      if (canvasContext.current) {
        await fetchVideoStream({
          videoElement: videoElement.current,
          videoStream: videoStream.current,
        })

        await captureAndDecode()
      }
    }
  }

  const handleOpen = () => {
    window.open(barcode, "_blank")
  }

  const handleClear = async () => {
    setBarcode("")
    await captureAndDecode()
  }

  useEffect(() => {
   init()
  }, [])

  return (
    <>
      <Head>
        <title>qr-code-scanner</title>
        <meta name="description" content="qr-code-scanner" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <canvas ref={canvasElement} />
        <video ref={videoElement} width={100} height={100} />
      <main>
        <div className="w25 h25" />
        <div className="w50 h25" />
        <div className="w25 h25" />
        <div className="w25 h50" />
        <div className="square w50 h50">
          <div/>
          <div className="square-box" />
          <div/>
        </div>
        <div className="w25 h50" />
        <div className="w25 h25" />
        <div className="w50 h25" />
        <div className="w25 h25" />
      </main>
      <div className="result" style={{ bottom: barcode ? 0 : "-4rem" }}>
        {barcode}
        <button className="clear-button" onClick={handleClear}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="feather feather-x-square"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
        </button>
        <button className="open-button" onClick={handleOpen}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="feather feather-external-link"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>
    </>
  )
}
