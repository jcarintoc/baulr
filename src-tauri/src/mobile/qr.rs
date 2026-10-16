use qrcode::render::svg;
use qrcode::QrCode;

pub fn generate_qr_svg(content: &str) -> Result<String, String> {
    let code = QrCode::new(content.as_bytes())
        .map_err(|e| format!("Failed to generate QR code: {e}"))?;
    let image = code
        .render::<svg::Color>()
        .min_dimensions(200, 200)
        .dark_color(svg::Color("#09090b"))
        .light_color(svg::Color("#ffffff"))
        .build();
    Ok(image)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_qr_svg() {
        let svg = generate_qr_svg("http://192.168.1.100:8080/?token=abc123").unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }
}
