
import streamlit as st
st.download_button(
    label='Test',
    data=b'hello world',
    file_name='CONTRATO_21-2025_-_CONTROLSEC_-_RELÓGIO_PONTO.pdf',
    mime='application/pdf'
)
