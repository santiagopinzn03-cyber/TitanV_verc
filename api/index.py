import os
import sys

# Vercel ejecuta funciones Python desde la raíz del repo. El backend usa
# imports absolutos del paquete `app` (ej. `from app.core...`), así que
# agregamos `backend/` al sys.path para que `app` sea resoluble.
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND = os.path.join(RAIZ, "backend")
for ruta in (BACKEND, RAIZ):
    if ruta not in sys.path:
        sys.path.insert(0, ruta)

from app.main import app  # noqa: E402

# Compatibilidad: algunos runtimes buscan `handler`, otros aceptan ASGI `app`.
try:
    from mangum import Mangum  # type: ignore

    handler = Mangum(app)
except Exception:
    handler = app

__all__ = ["app", "handler"]
