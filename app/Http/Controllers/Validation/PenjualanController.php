<?php

namespace App\Http\Controllers\Validation;

class PenjualanController extends BaseDocumentController
{
    protected function getDocumentType(): string
    {
        return 'penjualan';
    }

    protected function getRoutePrefix(): string
    {
        return 'penjualan';
    }

    protected function getViewPrefix(): string
    {
        return 'penjualan';
    }

    public function reguler()
    {
        return $this->renderUploadPage('Reguler');
    }

    public function ecommerce()
    {
        return $this->renderUploadPage('ecommerce');
    }

    public function debitur()
    {
        return $this->renderUploadPage('Debitur');
    }

    public function konsi()
    {
        return $this->renderUploadPage('Konsi');
    }
}
