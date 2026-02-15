package com.sdlcassist.controller;

import com.sdlcassist.dto.AiAnalysisResponse;
import com.sdlcassist.dto.FileResponse;
import com.sdlcassist.model.ProjectFile;
import com.sdlcassist.service.AiService;
import com.sdlcassist.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final AiService aiService;

    @PostMapping("/files")
    public ResponseEntity<List<FileResponse>> uploadFiles(
            @PathVariable UUID projectId,
            @RequestParam("files") MultipartFile[] files,
            Principal principal) {
        List<ProjectFile> uploaded = fileService.uploadFiles(projectId, files, principal.getName());
        List<FileResponse> response = uploaded.stream().map(FileResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/files")
    public ResponseEntity<List<FileResponse>> getFiles(@PathVariable UUID projectId) {
        List<FileResponse> response = fileService.getFilesByProject(projectId).stream()
                .map(FileResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/files/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable UUID projectId, @PathVariable UUID fileId) {
        ProjectFile file = fileService.getFile(fileId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(file.getMimeType()))
                .contentLength(file.getFileSize())
                .body(file.getFileData());
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable UUID projectId, @PathVariable UUID fileId) {
        fileService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/analyze")
    public ResponseEntity<AiAnalysisResponse> analyzeRequirements(@PathVariable UUID projectId) {
        String content = aiService.analyzeRequirements(projectId);
        return ResponseEntity.ok(AiAnalysisResponse.builder().content(content).build());
    }
}
