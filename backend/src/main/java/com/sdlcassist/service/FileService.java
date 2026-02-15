package com.sdlcassist.service;

import com.sdlcassist.model.Project;
import com.sdlcassist.model.ProjectFile;
import com.sdlcassist.model.User;
import com.sdlcassist.repository.ProjectFileRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final ProjectFileRepository fileRepository;
    private final ProjectService projectService;
    private final UserService userService;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_FILES_PER_PROJECT = 3;

    @Transactional
    public List<ProjectFile> uploadFiles(UUID projectId, MultipartFile[] files, String username) {
        Project project = projectService.findById(projectId);
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        long existingCount = fileRepository.countByProjectId(projectId);
        if (existingCount + files.length > MAX_FILES_PER_PROJECT) {
            throw new IllegalArgumentException(
                    "Maximum " + MAX_FILES_PER_PROJECT + " files per project. Currently have " + existingCount);
        }

        return java.util.Arrays.stream(files).map(file -> {
            validateFile(file);
            try {
                String extractedText = extractText(file);
                ProjectFile projectFile = ProjectFile.builder()
                        .project(project)
                        .uploadedBy(user)
                        .originalFilename(file.getOriginalFilename())
                        .mimeType(file.getContentType())
                        .fileSize(file.getSize())
                        .fileData(file.getBytes())
                        .extractedText(extractedText)
                        .build();
                return fileRepository.save(projectFile);
            } catch (IOException e) {
                throw new RuntimeException("Failed to process file: " + file.getOriginalFilename(), e);
            }
        }).toList();
    }

    public List<ProjectFile> getFilesByProject(UUID projectId) {
        return fileRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public ProjectFile getFile(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new EntityNotFoundException("File not found: " + fileId));
    }

    @Transactional
    public void deleteFile(UUID fileId) {
        if (!fileRepository.existsById(fileId)) {
            throw new EntityNotFoundException("File not found: " + fileId);
        }
        fileRepository.deleteById(fileId);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 10MB: " + file.getOriginalFilename());
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            // Also check by extension for markdown files (browsers may send different MIME types)
            String filename = file.getOriginalFilename();
            if (filename != null && filename.toLowerCase().endsWith(".md")) {
                return;
            }
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }
    }

    private String extractText(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if ("application/pdf".equals(contentType)) {
            return extractFromPdf(file.getInputStream());
        } else if ("application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)) {
            return extractFromDocx(file.getInputStream());
        } else {
            // TXT, MD, or any text-based file
            return extractFromText(file.getInputStream());
        }
    }

    private String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractFromDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractFromText(InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }
}
