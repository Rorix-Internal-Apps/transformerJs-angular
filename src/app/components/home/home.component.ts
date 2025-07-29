import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { SharedModule } from "../../shared/shared.module";
import { DetectionWorkerService } from "../../services/detection-worker.service";
import heic2any from "heic2any";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface DetectionResult {
  box: {
    xmax: number;
    xmin: number;
    ymax: number;
    ymin: number;
  };
  label: string;
  score: number;
}

interface ModifiedResult {
  label: string;
  score: number;
  box: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
}

@Component({
  selector: "app-home",
  imports: [SharedModule],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
  private detectionWorkerService = inject(DetectionWorkerService);
  private destroyRef = inject(DestroyRef);

  private fileObject!: File;
  private imageWidth = 0;
  private imageHeight = 0;

  selectedFile = "";
  detections: ModifiedResult[] = [];
  isLoading: boolean = false;
  error: string = "";

  async ngOnInit() {
    this.detectionWorkerService.getWorkerSubscriber$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        if (res.data.type == "detectionResult") {
          if(!res.data.detections?.length) {
            this.error = 'There is nothing to detect';
          } else {
            this.error = "";
          }
          this.modifyDetectionObject(res.data.detections);
        }
        if (res.data.type == "detectionError") {
          this.error = res.data.error;
        }
        this.isLoading = false;
      },
    });
  }

  async fileChange(event: any) {
    let file = event.target.files[0];
    if (
      String(file.name).toLowerCase().includes(".heic") ||
      String(file.name).toLowerCase().includes(".heif")
    ) {
      const jpegFile: File = (await this.convertHeicToJpeg(file)) as File;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(jpegFile);
      file = dataTransfer.files[0];
    }
    this.fileObject = file;
    this.selectedFile = URL.createObjectURL(file);
  }

  async detect() {
    if (this.isLoading) {
      return;
    }
    this.detections = [];
    this.isLoading = true;
    await this.detectOffline(this.fileObject);
  }

  modifyDetectionObject(data: DetectionResult[]) {
    const detections: ModifiedResult[] = [...data]
      .filter((obj: DetectionResult) => obj.score > 0.6)
      .sort((a: DetectionResult, b: DetectionResult) => b.score - a.score)
      .map((obj: DetectionResult) => {
        const { xmin, ymin, xmax, ymax } = obj.box;
        return {
          label: obj.label,
          score: Math.round(obj.score * 100),
          box: {
            left: (xmin / this.imageWidth) * 100 + "%",
            top: (ymin / this.imageHeight) * 100 + "%",
            width: ((xmax - xmin) / this.imageWidth) * 100 + "%",
            height: ((ymax - ymin) / this.imageHeight) * 100 + "%",
          },
        };
      });
    detections.forEach((ele) => {
      const find = this.detections.find((x) => x.label === ele.label);
      if (!find) {
        this.detections.push(ele);
      }
    });
  }

  async detectOffline(file: File) {
    this.detectionWorkerService.sendMessage("detectObjects", file);
  }

  async detectOnline(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/detr-resnet-50",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": file.type,
        },
        body: arrayBuffer,
      }
    );
    return await response.json();
  }

  onImageLoad(event: Event) {
    this.detections = [];
    const image = event.target as HTMLImageElement;
    this.imageWidth = image.naturalWidth;
    this.imageHeight = image.naturalHeight;
  }

  async convertHeicToJpeg(heicFile: File): Promise<File | null> {
    try {
      const result = await heic2any({
        blob: heicFile,
        toType: "image/jpeg",
        quality: 0.5,
      });
      const file = Array.isArray(result) ? result[0] : result;
      let metadata = {
        type: `image/jpeg`,
      };
      return new File([file], `${+new Date()}.jpeg`, metadata);
    } catch (error) {
      console.error("Error converting HEIC to JPEG:", error);
    }
    return null;
  }
}
