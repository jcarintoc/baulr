pub mod html;
pub mod qr;
pub mod server;

pub use qr::generate_qr_svg;
pub use server::{
    generate_pairing_token, get_local_ip, start_server, MobileClientConnectedEvent,
    MobileFileReceivedEvent, MobileReceiverInfo, MobileReceiverStatus, MobileServerHandle,
};
