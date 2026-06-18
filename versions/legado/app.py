import sys
import os

# Adiciona execution/ ao path para que os imports relativos de painel.py funcionem
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "execution"))

# Executa painel.py no namespace atual para que o Streamlit funcione corretamente
# (exec preserva o namespace e permite que st.session_state e reruns funcionem)
_painel_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "execution", "painel.py")
with open(_painel_path, encoding="utf-8") as _f:
    exec(_f.read())

